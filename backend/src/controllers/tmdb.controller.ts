import { Request, Response } from 'express';
import { TMDBService } from '../services/tmdb.service';

export const TMDBController = {
  async search(req: Request, res: Response): Promise<void> {
    const { query, type, page } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    if (type !== 'movie' && type !== 'tv') {
      res.status(400).json({ error: 'type must be "movie" or "tv"' });
      return;
    }

    try {
      const result = await TMDBService.search(query, type, page ? Number(page) : undefined);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getDetails(req: Request, res: Response): Promise<void> {
    const { type, tmdbId } = req.params;

    if (type !== 'movie' && type !== 'tv') {
      res.status(400).json({ error: 'type must be "movie" or "tv"' });
      return;
    }

    const id = Number(tmdbId);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'tmdbId must be a positive integer' });
      return;
    }

    try {
      const result = await TMDBService.getDetails(type, id);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getTrending(req: Request, res: Response): Promise<void> {
    const { type, timeWindow } = req.query;

    const resolvedType =
      type === 'movie' || type === 'tv' || type === 'all' ? type : 'all';
    const resolvedTimeWindow =
      timeWindow === 'day' || timeWindow === 'week' ? timeWindow : 'week';

    try {
      const result = await TMDBService.getTrending(resolvedType, resolvedTimeWindow);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
