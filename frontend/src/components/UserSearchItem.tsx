import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getPosterUrl } from '../lib/tmdb';
import { Avatar } from './Avatar';
import type { UserSearchResult } from '../lib/types';
import './UserSearchItem.css';

interface UserSearchItemProps {
  user: UserSearchResult;
  /** Initial follow state — caller should derive from GET /users/:userId/follow-status */
  isFollowing?: boolean;
  /** Called after successful follow/unfollow so parent can refresh if needed */
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export function UserSearchItem({ user, isFollowing = false, onFollowChange }: UserSearchItemProps) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(isFollowing);
  const [isPending, setIsPending] = useState(false);

  const currentlyWatchingPoster =
    user.currentlyWatching?.posterPath?.startsWith('http')
      ? user.currentlyWatching.posterPath
      : getPosterUrl(user.currentlyWatching?.posterPath, 'w92');

  async function handleFollowToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (isPending) return;

    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setIsPending(true);

    try {
      if (wasFollowing) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        await api.post(`/users/${user.id}/follow`, {});
      }
      onFollowChange?.(user.id, !wasFollowing);
    } catch {
      setFollowing(wasFollowing);
    } finally {
      setIsPending(false);
    }
  }

  function handleCardClick() {
    navigate(`/users/${user.id}`);
  }

  return (
    <div className="user-search-item" onClick={handleCardClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`View profile of ${user.firstName} ${user.lastName}`}
    >
      <Avatar
        src={user.profilePicture}
        firstName={user.firstName}
        lastName={user.lastName}
        size="md"
      />

      <div className="user-search-item__info">
        <span className="user-search-item__name">
          {user.firstName} {user.lastName}
        </span>
        <span className="user-search-item__username">@{user.username}</span>

        {user.currentlyWatching && (
          <div className="user-search-item__watching">
            {currentlyWatchingPoster && (
              <img
                src={currentlyWatchingPoster}
                alt=""
                className="user-search-item__watching-poster"
              />
            )}
            <span className="user-search-item__watching-title">
              Watching: {user.currentlyWatching.title}
            </span>
          </div>
        )}
      </div>

      <button
        className={`user-search-item__follow-btn ${following ? 'user-search-item__follow-btn--following' : ''}`}
        onClick={handleFollowToggle}
        disabled={isPending}
        aria-label={following ? `Unfollow ${user.firstName}` : `Follow ${user.firstName}`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
