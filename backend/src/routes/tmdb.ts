import { Router } from 'express';
import { TMDBController } from '../controllers/tmdb.controller';

const router = Router();

router.get('/search', TMDBController.search);
router.get('/trending', TMDBController.getTrending);
router.get('/:type/:tmdbId', TMDBController.getDetails);

export default router;
