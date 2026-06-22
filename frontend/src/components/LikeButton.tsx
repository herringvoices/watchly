import { useState } from 'react';
import { Heart } from 'lucide-react';
import { api } from '../lib/api';
import './LikeButton.css';

interface LikeButtonProps {
  type: 'update' | 'comment';
  id: number;
  likeCount: number;
  isLikedByMe: boolean;
}

export function LikeButton({ type, id, likeCount, isLikedByMe }: LikeButtonProps) {
  const [liked, setLiked] = useState(isLikedByMe);
  const [count, setCount] = useState(likeCount);
  const [isPending, setIsPending] = useState(false);

  const path = type === 'update' ? `/updates/${id}/like` : `/comments/${id}/like`;

  async function handleClick() {
    if (isPending) return;

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));
    setIsPending(true);

    try {
      if (wasLiked) {
        await api.delete<{ liked: false; likeCount: number }>(path);
      } else {
        await api.post<{ liked: true; likeCount: number }>(path, {});
      }
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      className={`like-btn${liked ? ' like-btn--liked' : ''}`}
      onClick={handleClick}
      disabled={isPending}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
    >
      <Heart className="like-btn-icon" />
      <span className="like-btn-count">{count}</span>
    </button>
  );
}
