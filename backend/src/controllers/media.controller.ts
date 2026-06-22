import { Request, Response } from 'express';
import { MediaService } from '../services/media.service';

export const MediaController = {
  async getMedia(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const watchlist = req.query.watchlist as string | undefined;

    try {
      const result = await MediaService.getMediaByUser(userId, watchlist);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async addMedia(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { tmdbId, mediaType, watchlist } = req.body;

    if (!tmdbId || !mediaType || !watchlist) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!['movie', 'tv'].includes(mediaType)) {
      res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
      return;
    }

    try {
      const result = await MediaService.addMediaToLibrary(userId, Number(tmdbId), mediaType, watchlist);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async checkMedia(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const tmdbId = Number(req.params.tmdbId);
    const { type } = req.query;

    if (isNaN(tmdbId)) {
      res.status(400).json({ error: 'Invalid tmdbId' });
      return;
    }

    if (type !== 'movie' && type !== 'tv') {
      res.status(400).json({ error: 'type must be "movie" or "tv"' });
      return;
    }

    try {
      const result = await MediaService.checkUserMedia(userId, tmdbId, type);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async moveToWatchlist(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const mediaId = Number(req.params.mediaId);
    const { watchlist } = req.body;

    if (isNaN(mediaId)) {
      res.status(400).json({ error: 'Invalid mediaId' });
      return;
    }

    if (!watchlist) {
      res.status(400).json({ error: 'Missing required field: watchlist' });
      return;
    }

    try {
      const result = await MediaService.moveMediaToWatchlist(mediaId, userId, watchlist);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async removeMedia(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const mediaId = Number(req.params.mediaId);

    if (isNaN(mediaId)) {
      res.status(400).json({ error: 'Invalid mediaId' });
      return;
    }

    try {
      await MediaService.removeMediaFromLibrary(mediaId, userId);
      res.status(204).send();
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
