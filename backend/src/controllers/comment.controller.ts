import { Request, Response } from 'express';
import { CommentService } from '../services/comment.service';

export const CommentController = {
  async getComments(req: Request, res: Response): Promise<void> {
    const updateId = Number(req.params.updateId);
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const offset = Number(req.query.offset ?? 0);

    if (isNaN(updateId)) {
      res.status(400).json({ error: 'Invalid updateId' });
      return;
    }

    try {
      const userId = req.user?.id;
      const result = await CommentService.getComments(updateId, limit, offset, userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async addComment(req: Request, res: Response): Promise<void> {
    const updateId = Number(req.params.updateId);
    const userId = req.user!.id;
    const { text } = req.body;

    if (isNaN(updateId)) {
      res.status(400).json({ error: 'Invalid updateId' });
      return;
    }

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    try {
      const comment = await CommentService.addComment(updateId, userId, text);
      res.status(201).json({ comment });
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async deleteComment(req: Request, res: Response): Promise<void> {
    const commentId = Number(req.params.commentId);
    const userId = req.user!.id;

    if (isNaN(commentId)) {
      res.status(400).json({ error: 'Invalid commentId' });
      return;
    }

    try {
      await CommentService.deleteComment(commentId, userId);
      res.status(204).send();
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
