import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      const result = await AuthService.register({ username, email, password, firstName, lastName });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Missing username or password' });
      return;
    }

    try {
      const result = await AuthService.login(username, password);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },

  async me(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.getCurrentUser(req.user!.id);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  },
};
