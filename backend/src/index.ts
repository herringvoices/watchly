import cors from 'cors';
import express from 'express';
import authRouter from './routes/auth';
import tmdbRouter from './routes/tmdb';
import mediaRouter from './routes/media';
import ratingsRouter from './routes/ratings';
import updatesRouter from './routes/updates';
import commentsRouter from './routes/comments';
import usersRouter from './routes/users';

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/tmdb', tmdbRouter);
app.use('/media', mediaRouter);
app.use('/ratings', ratingsRouter);
app.use('/updates', updatesRouter);
app.use('/comments', commentsRouter);
app.use('/users', usersRouter);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
