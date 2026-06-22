import prisma from '../lib/prisma';

const MAX_RETRIES = 3;

export const MediaRatingService = {
  async updateUserRating(
    mediaApiId: number,
    mediaType: string,
    _userId: string,
    newUserRating: number | null,
    previousUserRating: number | null,
  ): Promise<void> {
    // No-op: user had no rating before and still has none
    if (previousUserRating === null && newUserRating === null) return;

    const isFirstUpdate = previousUserRating === null;
    const isRemoved = newUserRating === null;

    let attempts = 0;
    let success = false;

    while (!success && attempts < MAX_RETRIES) {
      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.mediaRating.findUnique({
            where: { mediaApiId_mediaType: { mediaApiId, mediaType } },
          });

          const current = existing ?? { sumOfRatings: 0, numberOfRatings: 0 };
          let { sumOfRatings, numberOfRatings } = current;

          if (isFirstUpdate) {
            numberOfRatings += 1;
            sumOfRatings += newUserRating!;
          } else if (isRemoved) {
            sumOfRatings -= previousUserRating!;
            numberOfRatings -= 1;
          } else {
            sumOfRatings = sumOfRatings - previousUserRating! + newUserRating!;
          }

          const rating = numberOfRatings > 0 ? sumOfRatings / numberOfRatings : null;

          await tx.mediaRating.upsert({
            where: { mediaApiId_mediaType: { mediaApiId, mediaType } },
            create: { mediaApiId, mediaType, sumOfRatings, numberOfRatings, rating },
            update: { sumOfRatings, numberOfRatings, rating },
          });
        });

        success = true;
      } catch {
        attempts++;
      }
    }

    if (!success) {
      throw new Error(`Failed to update media rating after ${MAX_RETRIES} attempts`);
    }
  },

  async getRatingForMedia(tmdbId: number, type: string) {
    const row = await prisma.mediaRating.findUnique({
      where: { mediaApiId_mediaType: { mediaApiId: tmdbId, mediaType: type } },
    });

    if (!row || row.numberOfRatings === 0) {
      return { tmdbId, type, rating: null, numberOfRatings: 0 };
    }

    return { tmdbId, type, rating: row.rating, numberOfRatings: row.numberOfRatings };
  },
};
