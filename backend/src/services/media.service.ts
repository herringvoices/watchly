import { MediaStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { TMDBService } from './tmdb.service';
import { MediaUpdateService } from './media-update.service';

function httpError(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}

const WATCHLIST_TO_STATUS: Record<string, MediaStatus> = {
  'Currently Watching': MediaStatus.CurrentlyWatching,
  'Want to Watch': MediaStatus.WantToWatch,
  'Hiatus': MediaStatus.Hiatus,
};

const STATUS_TO_WATCHLIST: Record<MediaStatus, string> = {
  [MediaStatus.CurrentlyWatching]: 'Currently Watching',
  [MediaStatus.WantToWatch]: 'Want to Watch',
  [MediaStatus.Hiatus]: 'Hiatus',
  [MediaStatus.Watched]: 'Watched',
  [MediaStatus.Dropped]: 'Dropped',
};

export const MediaService = {
  async addMediaToLibrary(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    watchlist: string,
  ) {
    const status = WATCHLIST_TO_STATUS[watchlist];
    if (!status) throw httpError('Invalid watchlist value', 400);

    const existing = await prisma.media.findFirst({ where: { userId, mediaApiId: tmdbId, mediaType } });
    if (existing) throw httpError('Media already in library', 409);

    const details = await TMDBService.getDetails(mediaType, tmdbId);

    await prisma.mediaRating.upsert({
      where: { mediaApiId_mediaType: { mediaApiId: tmdbId, mediaType } },
      update: {},
      create: { mediaApiId: tmdbId, mediaType },
    });

    const media = await prisma.media.create({
      data: {
        userId,
        mediaApiId: tmdbId,
        mediaType,
        title: details.title,
        description: details.overview,
        thumbnail: details.posterPath,
        mediaStatus: status,
      },
    });

    return { media };
  },

  async moveMediaToWatchlist(mediaId: number, userId: string, watchlist: string) {
    const status = WATCHLIST_TO_STATUS[watchlist];
    if (!status) throw httpError('Invalid watchlist value', 400);

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.userId !== userId) throw httpError('Media not found', 404);

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: { mediaStatus: status },
    });

    return { media: updated };
  },

  async removeMediaFromLibrary(mediaId: number, userId: string) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.userId !== userId) throw httpError('Media not found', 404);

    await prisma.$transaction(async (tx) => {
      const updates = await tx.mediaUpdate.findMany({
        where: { mediaId },
        select: { id: true },
      });
      const updateIds = updates.map((u) => u.id);

      const comments = await tx.comment.findMany({
        where: { updateId: { in: updateIds } },
        select: { id: true },
      });
      const commentIds = comments.map((c) => c.id);

      await tx.commentLike.deleteMany({ where: { commentId: { in: commentIds } } });
      await tx.comment.deleteMany({ where: { id: { in: commentIds } } });
      await tx.updateLike.deleteMany({ where: { updateId: { in: updateIds } } });
      await tx.mediaUpdate.deleteMany({ where: { id: { in: updateIds } } });
      await tx.media.delete({ where: { id: mediaId } });
    });

    await MediaUpdateService.handleMediaRemoved(mediaId, userId);
  },

  async getMediaByUser(userId: string, watchlist?: string) {
    type WhereClause = { userId: string; mediaStatus?: MediaStatus | { in: MediaStatus[] } };
    const where: WhereClause = { userId };

    if (watchlist) {
      const status = WATCHLIST_TO_STATUS[watchlist];
      if (!status) throw httpError('Invalid watchlist value', 400);
      where.mediaStatus = status;
    } else {
      where.mediaStatus = {
        in: [MediaStatus.CurrentlyWatching, MediaStatus.WantToWatch, MediaStatus.Hiatus],
      };
    }

    const allMedia = await prisma.media.findMany({ where });

    const mapMedia = (m: (typeof allMedia)[number]) => ({ ...m, tmdbId: m.mediaApiId });

    return {
      currentlyWatching: allMedia.filter((m) => m.mediaStatus === MediaStatus.CurrentlyWatching).map(mapMedia),
      wantToWatch: allMedia.filter((m) => m.mediaStatus === MediaStatus.WantToWatch).map(mapMedia),
      hiatus: allMedia.filter((m) => m.mediaStatus === MediaStatus.Hiatus).map(mapMedia),
    };
  },

  async checkUserMedia(userId: string, tmdbId: number, mediaType: 'movie' | 'tv') {
    const media = await prisma.media.findFirst({ where: { userId, mediaApiId: tmdbId, mediaType } });

    if (!media) {
      return { inLibrary: false, watchlist: null, userRating: null, mediaId: null };
    }

    return {
      inLibrary: true,
      watchlist: STATUS_TO_WATCHLIST[media.mediaStatus],
      userRating: media.rating,
      mediaId: media.id,
    };
  },
};
