import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { CommentController } from '../controllers/comment.controller';
import { LikeController } from '../controllers/like.controller';

const router = Router();

router.delete('/:commentId', requireAuth, CommentController.deleteComment);
router.post('/:commentId/like', requireAuth, LikeController.likeComment);
router.delete('/:commentId/like', requireAuth, LikeController.unlikeComment);

export default router;
