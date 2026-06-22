import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, MediaController.getMedia);
router.post('/', requireAuth, MediaController.addMedia);
router.get('/check/:tmdbId', requireAuth, MediaController.checkMedia);
router.put('/:mediaId/watchlist', requireAuth, MediaController.moveToWatchlist);
router.delete('/:mediaId', requireAuth, MediaController.removeMedia);

export default router;
