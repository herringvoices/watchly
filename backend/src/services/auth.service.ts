import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecretdevkey';

function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(user: User) {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

function httpError(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}

export const AuthService = {
  async register(data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    });

    if (existing) {
      throw httpError('Username or email already taken', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    return { user: sanitizeUser(user), jwt: signToken(user.id) };
  },

  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw httpError('Invalid credentials', 401);
    }

    return { user: sanitizeUser(user), jwt: signToken(user.id) };
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw httpError('User not found', 404);
    }

    return { user: sanitizeUser(user) };
  },
};
