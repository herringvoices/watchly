import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export const UserController = {
  async searchUsers(req: Request, res: Response): Promise<void> {
    const query = String(req.query.query ?? '');
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const offset = Number(req.query.offset ?? 0);

    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    try {
      const result = await UserService.searchUsers(query, limit, offset);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    try {
      const result = await UserService.getUser(userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async editProfile(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const currentUserId = req.user!.id;
    const { firstName, lastName, bio, profilePicture } = req.body;

    try {
      const result = await UserService.editProfile(userId, currentUserId, {
        firstName,
        lastName,
        bio,
        profilePicture,
      });
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getWatchlists(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    try {
      const result = await UserService.getWatchlists(userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async getUserStats(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    try {
      const result = await UserService.getUserStats(userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
