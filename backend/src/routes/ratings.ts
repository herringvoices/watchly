import { Router } from 'express';
import { MediaRatingController } from '../controllers/media-rating.controller';

const router = Router();

router.get('/:tmdbId', MediaRatingController.getRating);

export default router;
