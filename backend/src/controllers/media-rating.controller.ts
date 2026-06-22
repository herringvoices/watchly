import { Request, Response } from 'express';
import { MediaRatingService } from '../services/media-rating.service';

export const MediaRatingController = {
  async getRating(req: Request, res: Response): Promise<void> {
    const tmdbId = Number(req.params.tmdbId);
    const type = req.query.type as string | undefined;

    if (isNaN(tmdbId)) {
      res.status(400).json({ error: 'Invalid tmdbId' });
      return;
    }

    if (!type || !['movie', 'tv'].includes(type)) {
      res.status(400).json({ error: 'Query param "type" must be "movie" or "tv"' });
      return;
    }

    try {
      const result = await MediaRatingService.getRatingForMedia(tmdbId, type);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
