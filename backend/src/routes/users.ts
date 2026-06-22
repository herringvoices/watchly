import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { UserController } from '../controllers/user.controller';
import { FollowController } from '../controllers/follow.controller';

const router = Router();

// Static routes before parameterised ones
router.get('/search', UserController.searchUsers);

router.get('/:userId', UserController.getUser);
router.put('/:userId', requireAuth, UserController.editProfile);
router.get('/:userId/watchlists', UserController.getWatchlists);
router.get('/:userId/stats', UserController.getUserStats);

router.get('/:userId/followers', FollowController.getFollowers);
router.get('/:userId/following', FollowController.getFollowing);
router.get('/:userId/follow-status', requireAuth, FollowController.getFollowStatus);
router.post('/:userId/follow', requireAuth, FollowController.followUser);
router.delete('/:userId/follow', requireAuth, FollowController.unfollowUser);

export default router;
