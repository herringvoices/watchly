import prisma from '../lib/prisma';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  profilePicture: true,
};

export const FollowService = {
  async getFollowers(userId: string, limit = 20, offset = 0) {
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { recipientId: userId },
        include: { sender: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.follow.count({ where: { recipientId: userId } }),
    ]);
    const users = follows.map((f) => f.sender);
    return { users, total, hasMore: offset + users.length < total };
  },

  async getFollowing(userId: string, limit = 20, offset = 0) {
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { senderId: userId },
        include: { recipient: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.follow.count({ where: { senderId: userId } }),
    ]);
    const users = follows.map((f) => f.recipient);
    return { users, total, hasMore: offset + users.length < total };
  },

  async getFollowStatus(currentUserId: string, userId: string) {
    const [isFollowing, isFollowedBy] = await Promise.all([
      prisma.follow.findUnique({
        where: { senderId_recipientId: { senderId: currentUserId, recipientId: userId } },
      }),
      prisma.follow.findUnique({
        where: { senderId_recipientId: { senderId: userId, recipientId: currentUserId } },
      }),
    ]);
    return { isFollowing: !!isFollowing, isFollowedBy: !!isFollowedBy };
  },

  async followUser(currentUserId: string, userId: string) {
    if (currentUserId === userId) {
      const err: any = new Error('Cannot follow yourself');
      err.status = 400;
      throw err;
    }

    await prisma.follow.upsert({
      where: { senderId_recipientId: { senderId: currentUserId, recipientId: userId } },
      create: { senderId: currentUserId, recipientId: userId },
      update: {},
    });
    return { following: true };
  },

  async unfollowUser(currentUserId: string, userId: string) {
    await prisma.follow.deleteMany({
      where: { senderId: currentUserId, recipientId: userId },
    });
    return { following: false };
  },
};
