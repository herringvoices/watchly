import { MediaStatus } from '@prisma/client';
import prisma from '../lib/prisma';

function httpError(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}

const userPublicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  profilePicture: true,
  bio: true,
  createdAt: true,
};

export const UserService = {
  async searchUsers(query: string, limit = 20, offset = 0) {
    const where = {
      OR: [
        { username: { contains: query, mode: 'insensitive' as const } },
        { firstName: { contains: query, mode: 'insensitive' as const } },
        { lastName: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: userPublicSelect, take: limit, skip: offset }),
      prisma.user.count({ where }),
    ]);

    return { users, total, hasMore: offset + users.length < total };
  },

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userPublicSelect });
    if (!user) throw httpError('User not found', 404);
    return { user };
  },

  async editProfile(
    userId: string,
    currentUserId: string,
    profileData: { firstName?: string; lastName?: string; bio?: string; profilePicture?: string },
  ) {
    if (userId !== currentUserId) throw httpError('Forbidden', 403);

    const user = await prisma.user.update({
      where: { id: userId },
      data: profileData,
      select: userPublicSelect,
    });
    return { user };
  },

  async getWatchlists(userId: string) {
    const allMedia = await prisma.media.findMany({
      where: {
        userId,
        mediaStatus: { in: [MediaStatus.CurrentlyWatching, MediaStatus.WantToWatch, MediaStatus.Hiatus] },
      },
    });

    const mapMedia = (m: (typeof allMedia)[number]) => ({ ...m, tmdbId: m.mediaApiId });

    return {
      currentlyWatching: allMedia.filter((m) => m.mediaStatus === MediaStatus.CurrentlyWatching).map(mapMedia),
      wantToWatch: allMedia.filter((m) => m.mediaStatus === MediaStatus.WantToWatch).map(mapMedia),
      hiatus: allMedia.filter((m) => m.mediaStatus === MediaStatus.Hiatus).map(mapMedia),
    };
  },

  async getUserStats(userId: string) {
    const [followerCount, followingCount, updateCount, mediaCount] = await Promise.all([
      prisma.follow.count({ where: { recipientId: userId } }),
      prisma.follow.count({ where: { senderId: userId } }),
      prisma.mediaUpdate.count({ where: { userId } }),
      prisma.media.count({ where: { userId } }),
    ]);

    return { followerCount, followingCount, updateCount, mediaCount };
  },
};
