import { Request, Response } from 'express';
import { LikeService } from '../services/like.service';

export const LikeController = {
  async likeUpdate(req: Request, res: Response): Promise<void> {
    const updateId = Number(req.params.updateId);
    const userId = req.user!.id;

    if (isNaN(updateId)) {
      res.status(400).json({ error: 'Invalid updateId' });
      return;
    }

    try {
      const result = await LikeService.likeUpdate(updateId, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async unlikeUpdate(req: Request, res: Response): Promise<void> {
    const updateId = Number(req.params.updateId);
    const userId = req.user!.id;

    if (isNaN(updateId)) {
      res.status(400).json({ error: 'Invalid updateId' });
      return;
    }

    try {
      const result = await LikeService.unlikeUpdate(updateId, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async likeComment(req: Request, res: Response): Promise<void> {
    const commentId = Number(req.params.commentId);
    const userId = req.user!.id;

    if (isNaN(commentId)) {
      res.status(400).json({ error: 'Invalid commentId' });
      return;
    }

    try {
      const result = await LikeService.likeComment(commentId, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async unlikeComment(req: Request, res: Response): Promise<void> {
    const commentId = Number(req.params.commentId);
    const userId = req.user!.id;

    if (isNaN(commentId)) {
      res.status(400).json({ error: 'Invalid commentId' });
      return;
    }

    try {
      const result = await LikeService.unlikeComment(commentId, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
