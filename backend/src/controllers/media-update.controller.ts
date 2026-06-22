import { Request, Response } from 'express';
import { MediaUpdateService } from '../services/media-update.service';

export const MediaUpdateController = {
  async getUpdates(req: Request, res: Response): Promise<void> {
    const currentUserId = req.user?.id;
    const mediaId = req.query.mediaId !== undefined ? Number(req.query.mediaId) : undefined;
    const userId = req.query.userId as string | undefined;
    const followingOnly = req.query.followingOnly === 'true';
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : undefined;

    if (followingOnly && !currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const result = await MediaUpdateService.getUpdates(
        { mediaId, userId, followingOnly, limit, offset },
        currentUserId,
      );
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getUpdateById(req: Request, res: Response): Promise<void> {
    const updateId = Number(req.params.updateId);

    if (isNaN(updateId)) {
      res.status(400).json({ error: 'Invalid updateId' });
      return;
    }

    try {
      const result = await MediaUpdateService.getUpdateById(updateId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async addUpdate(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { mediaId, lastWatched, description, rating, watchSessionLength } = req.body;

    if (!mediaId || !lastWatched || rating === undefined || !watchSessionLength) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      const result = await MediaUpdateService.addUpdate(userId, {
        mediaId: Number(mediaId),
        lastWatched,
        description,
        rating: Number(rating),
        watchSessionLength,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async editUpdate(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const updateId = Number(req.params.updateId);
    const { lastWatched, description, rating, watchSessionLength } = req.body;

    if (isNaN(updateId)) {
      res.status(400).json({ error: 'Invalid updateId' });
      return;
    }

    try {
      const result = await MediaUpdateService.editUpdate(updateId, userId, {
        lastWatched,
        description,
        rating: rating !== undefined ? Number(rating) : undefined,
        watchSessionLength,
      });
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async deleteUpdate(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const updateId = Number(req.params.updateId);

    if (isNaN(updateId)) {
      res.status(400).json({ error: 'Invalid updateId' });
      return;
    }

    try {
      await MediaUpdateService.deleteUpdate(updateId, userId);
      res.status(204).send();
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
