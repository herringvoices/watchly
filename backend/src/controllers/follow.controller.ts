import { Request, Response } from 'express';
import { FollowService } from '../services/follow.service';

export const FollowController = {
  async getFollowers(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const offset = Number(req.query.offset ?? 0);

    try {
      const result = await FollowService.getFollowers(userId, limit, offset);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getFollowing(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const offset = Number(req.query.offset ?? 0);

    try {
      const result = await FollowService.getFollowing(userId, limit, offset);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getFollowStatus(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const currentUserId = req.user!.id;

    try {
      const result = await FollowService.getFollowStatus(currentUserId, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async followUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const currentUserId = req.user!.id;

    try {
      const result = await FollowService.followUser(currentUserId, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async unfollowUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const currentUserId = req.user!.id;

    try {
      const result = await FollowService.unfollowUser(currentUserId, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
