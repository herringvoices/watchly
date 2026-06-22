import { WatchSessionLength } from '@prisma/client';
import prisma from '../lib/prisma';
import { MediaRatingService } from './media-rating.service';

function httpError(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}

const SESSION_LENGTH_MAP: Record<string, WatchSessionLength> = {
  Short: WatchSessionLength.Short,
  Medium: WatchSessionLength.Medium,
  Long: WatchSessionLength.Long,
};

const SESSION_WEIGHT_MAP: Record<WatchSessionLength, number> = {
  [WatchSessionLength.Short]: 1,
  [WatchSessionLength.Medium]: 2,
  [WatchSessionLength.Long]: 3,
};

function buildUpdateInclude(currentUserId?: string) {
  return {
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        profilePicture: true,
      },
    },
    media: {
      select: {
        id: true,
        title: true,
        thumbnail: true,
        mediaApiId: true,
        mediaType: true,
      },
    },
    _count: { select: { likes: true, comments: true } },
    ...(currentUserId
      ? { likes: { where: { userId: currentUserId }, select: { id: true } } }
      : {}),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUpdate(raw: any) {
  const { _count, likes: userLikes, media, ...rest } = raw;
  return {
    ...rest,
    media: {
      id: media.id,
      title: media.title,
      thumbnail: media.thumbnail,
      mediaType: media.mediaType,
      tmdbId: media.mediaApiId,
    },
    likeCount: _count.likes,
    commentCount: _count.comments,
    isLikedByMe: Array.isArray(userLikes) ? userLikes.length > 0 : false,
  };
}

async function recalculateUserRating(userId: string, mediaId: number): Promise<number | null> {
  const updates = await prisma.mediaUpdate.findMany({
    where: { userId, mediaId },
    select: { rating: true, watchSessionLength: true },
  });

  if (updates.length === 0) return null;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const update of updates) {
    const weight = SESSION_WEIGHT_MAP[update.watchSessionLength];
    weightedSum += update.rating * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

export const MediaUpdateService = {
  async getUpdates(
    params: {
      mediaId?: number;
      userId?: string;
      followingOnly?: boolean;
      limit?: number;
      offset?: number;
    },
    currentUserId?: string,
  ) {
    const limit = Math.min(params.limit ?? 20, 50);
    const offset = params.offset ?? 0;

    const where: Record<string, unknown> = {};

    if (params.mediaId !== undefined) {
      where.mediaId = params.mediaId;
    }

    if (params.userId !== undefined) {
      where.userId = params.userId;
    }

    if (params.followingOnly && currentUserId) {
      const follows = await prisma.follow.findMany({
        where: { senderId: currentUserId },
        select: { recipientId: true },
      });
      where.userId = { in: follows.map((f) => f.recipientId) };
    }

    const [updates, total] = await Promise.all([
      prisma.mediaUpdate.findMany({
        where,
        include: buildUpdateInclude(currentUserId),
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.mediaUpdate.count({ where }),
    ]);

    return { updates: updates.map(mapUpdate), total, hasMore: offset + updates.length < total };
  },

  async getUpdateById(updateId: number) {
    const update = await prisma.mediaUpdate.findUnique({
      where: { id: updateId },
      include: buildUpdateInclude(),
    });

    if (!update) throw httpError('Update not found', 404);

    return { update: mapUpdate(update) };
  },

  async addUpdate(
    userId: string,
    updateData: {
      mediaId: number;
      lastWatched: string;
      description?: string;
      rating: number;
      watchSessionLength: string;
    },
  ) {
    const sessionLength = SESSION_LENGTH_MAP[updateData.watchSessionLength];
    if (!sessionLength) throw httpError('Invalid watchSessionLength', 400);

    const media = await prisma.media.findUnique({ where: { id: updateData.mediaId } });
    if (!media || media.userId !== userId) throw httpError('Media not found', 404);

    const previousUserRating = media.rating;

    const update = await prisma.mediaUpdate.create({
      data: {
        mediaId: updateData.mediaId,
        userId,
        lastWatched: updateData.lastWatched,
        description: updateData.description,
        rating: updateData.rating,
        watchSessionLength: sessionLength,
      },
      include: buildUpdateInclude(userId),
    });

    const newUserRating = await recalculateUserRating(userId, updateData.mediaId);

    await prisma.media.update({
      where: { id: updateData.mediaId },
      data: { rating: newUserRating },
    });

    await MediaRatingService.updateUserRating(
      media.mediaApiId,
      media.mediaType,
      userId,
      newUserRating,
      previousUserRating,
    );

    return { update: mapUpdate(update) };
  },

  async editUpdate(
    updateId: number,
    userId: string,
    updateData: {
      lastWatched?: string;
      description?: string;
      rating?: number;
      watchSessionLength?: string;
    },
  ) {
    const existing = await prisma.mediaUpdate.findUnique({ where: { id: updateId } });
    if (!existing || existing.userId !== userId) throw httpError('Update not found', 404);

    const data: Record<string, unknown> = {};
    if (updateData.lastWatched !== undefined) data.lastWatched = updateData.lastWatched;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.rating !== undefined) data.rating = updateData.rating;
    if (updateData.watchSessionLength !== undefined) {
      const sessionLength = SESSION_LENGTH_MAP[updateData.watchSessionLength];
      if (!sessionLength) throw httpError('Invalid watchSessionLength', 400);
      data.watchSessionLength = sessionLength;
    }

    const media = await prisma.media.findUnique({ where: { id: existing.mediaId } });
    if (!media) throw httpError('Media not found', 404);

    const previousUserRating = media.rating;

    const update = await prisma.mediaUpdate.update({
      where: { id: updateId },
      data,
      include: buildUpdateInclude(userId),
    });

    const newUserRating = await recalculateUserRating(userId, existing.mediaId);

    await prisma.media.update({
      where: { id: existing.mediaId },
      data: { rating: newUserRating },
    });

    await MediaRatingService.updateUserRating(
      media.mediaApiId,
      media.mediaType,
      userId,
      newUserRating,
      previousUserRating,
    );

    return { update: mapUpdate(update) };
  },

  async deleteUpdate(updateId: number, userId: string): Promise<void> {
    const existing = await prisma.mediaUpdate.findUnique({ where: { id: updateId } });
    if (!existing || existing.userId !== userId) throw httpError('Update not found', 404);

    const media = await prisma.media.findUnique({ where: { id: existing.mediaId } });
    if (!media) throw httpError('Media not found', 404);

    const previousUserRating = media.rating;

    await prisma.$transaction(async (tx) => {
      const comments = await tx.comment.findMany({
        where: { updateId },
        select: { id: true },
      });
      const commentIds = comments.map((c) => c.id);

      await tx.commentLike.deleteMany({ where: { commentId: { in: commentIds } } });
      await tx.comment.deleteMany({ where: { updateId } });
      await tx.updateLike.deleteMany({ where: { updateId } });
      await tx.mediaUpdate.delete({ where: { id: updateId } });
    });

    const newUserRating = await recalculateUserRating(userId, existing.mediaId);

    await prisma.media.update({
      where: { id: existing.mediaId },
      data: { rating: newUserRating },
    });

    await MediaRatingService.updateUserRating(
      media.mediaApiId,
      media.mediaType,
      userId,
      newUserRating,
      previousUserRating,
    );
  },

  async handleMediaRemoved(mediaId: number, userId: string): Promise<void> {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    const previousUserRating = media?.rating ?? null;

    await prisma.mediaUpdate.deleteMany({ where: { mediaId } });
    await prisma.media.updateMany({ where: { id: mediaId }, data: { rating: null } });

    if (media) {
      await MediaRatingService.updateUserRating(
        media.mediaApiId,
        media.mediaType,
        userId,
        null,
        previousUserRating,
      );
    }
  },
};
