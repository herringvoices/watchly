import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { CommentController } from '../controllers/comment.controller';
import { LikeController } from '../controllers/like.controller';
import { MediaUpdateController } from '../controllers/media-update.controller';

const router = Router();

router.get('/', optionalAuth, MediaUpdateController.getUpdates);
router.post('/', requireAuth, MediaUpdateController.addUpdate);
router.get('/:updateId', MediaUpdateController.getUpdateById);
router.put('/:updateId', requireAuth, MediaUpdateController.editUpdate);
router.delete('/:updateId', requireAuth, MediaUpdateController.deleteUpdate);
router.get('/:updateId/comments', optionalAuth, CommentController.getComments);
router.post('/:updateId/comments', requireAuth, CommentController.addComment);
router.post('/:updateId/like', requireAuth, LikeController.likeUpdate);
router.delete('/:updateId/like', requireAuth, LikeController.unlikeUpdate);

export default router;
