import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import { Avatar } from './Avatar';
import { StarRating } from './StarRating';
import { LikeButton } from './LikeButton';
import { CommentButton } from './CommentButton';
import { UpdateComment } from './UpdateComment';
import { getPosterUrl } from '../lib/tmdb';
import { formatRelativeTime } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import type { UpdateData, MediaCheckResult } from '../lib/types';
import './UpdateItem.css';

interface UpdateItemProps {
  update: UpdateData;
  /** When true: hides actions menu and comment button (used inside UpdateComment modal). */
  compact?: boolean;
  onDeleted?: (updateId: number) => void;
}

export function UpdateItem({ update, compact = false, onDeleted }: UpdateItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [actionsOpen, setActionsOpen] = useState(false);
  const [mediaCheck, setMediaCheck] = useState<MediaCheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [watchlistStep, setWatchlistStep] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(update.commentCount ?? 0);

  const actionsRef = useRef<HTMLDivElement>(null);
  const isOwnPost = user?.id === update.user.id;

  const posterUrl = update.media.thumbnail
    ? update.media.thumbnail.startsWith('http')
      ? update.media.thumbnail
      : getPosterUrl(update.media.thumbnail, 'w185')
    : null;

  // Lazy-fetch media check when popover first opens
  useEffect(() => {
    if (!actionsOpen || mediaCheck !== null || checkLoading) return;
    setCheckLoading(true);
    api
      .get<MediaCheckResult>(`/media/check/${update.media.tmdbId}?type=${update.media.mediaType}`)
      .then((data) => setMediaCheck(data))
      .catch(() =>
        setMediaCheck({ inLibrary: false, watchlist: null, userRating: null, mediaId: null })
      )
      .finally(() => setCheckLoading(false));
  }, [actionsOpen, mediaCheck, checkLoading, update.media.tmdbId]);

  // Close popover on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
        setWatchlistStep(false);
      }
    }
    if (actionsOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [actionsOpen]);

  const watchlistOptions = mediaCheck?.inLibrary
    ? ['Currently Watching', 'Want to Watch', 'Hiatus'].filter((w) => w !== mediaCheck.watchlist)
    : ['Currently Watching', 'Want to Watch'];

  async function handleWatchlistSelect(watchlist: string) {
    setActionsOpen(false);
    setWatchlistStep(false);
    setIsProcessing(true);
    try {
      if (mediaCheck?.inLibrary && mediaCheck.mediaId) {
        await api.put(`/media/${mediaCheck.mediaId}/watchlist`, { watchlist });
        setMediaCheck((prev) => (prev ? { ...prev, watchlist } : prev));
      } else {
        const data = await api.post<{ media: { id: number } }>('/media', {
          tmdbId: update.media.tmdbId,
          mediaType: update.media.mediaType,
          watchlist,
        });
        setMediaCheck({ inLibrary: true, watchlist, userRating: null, mediaId: data.media.id });
      }
    } catch {
      // silent
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeletePost() {
    setActionsOpen(false);
    setIsProcessing(true);
    try {
      await api.delete(`/updates/${update.id}`);
      onDeleted?.(update.id);
    } catch {
      setIsProcessing(false);
    }
  }

  function handleMediaClick() {
    navigate(`/media/${update.media.tmdbId}?type=${update.media.mediaType}`);
  }

  return (
    <>
      <article className={`update-item${isProcessing ? ' update-item--processing' : ''}${compact ? ' update-item--compact' : ''}`}>
        {/* Header */}
        <div className="update-item__header">
          <button
            className="update-item__user-btn"
            onClick={() => navigate(`/users/${update.user.id}`)}
            aria-label={`View ${update.user.firstName} ${update.user.lastName}'s profile`}
          >
            <Avatar
              src={update.user.profilePicture}
              firstName={update.user.firstName}
              lastName={update.user.lastName}
              size="md"
            />
            <div className="update-item__user-info">
              <span className="update-item__name">
                {update.user.firstName} {update.user.lastName}
              </span>
              <span className="update-item__timestamp">
                {formatRelativeTime(update.createdAt)}
              </span>
            </div>
          </button>

          {!compact && (
            <div className="update-item__actions-wrap" ref={actionsRef}>
              <button
                className="update-item__actions-btn"
                onClick={() => {
                  setActionsOpen((o) => !o);
                  setWatchlistStep(false);
                }}
                aria-label="More actions"
                aria-expanded={actionsOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal size={18} />
              </button>

              {actionsOpen && (
                <div className="update-item__popover" role="menu">
                  {checkLoading && (
                    <span className="update-item__popover-loading">Loading…</span>
                  )}

                  {!checkLoading && mediaCheck && !watchlistStep && (
                    <>
                      <button
                        className="update-item__popover-item"
                        role="menuitem"
                        onClick={() => setWatchlistStep(true)}
                      >
                        {mediaCheck.inLibrary ? 'Move to Watchlist' : 'Add to Watchlist'}
                      </button>
                      {isOwnPost && (
                        <button
                          className="update-item__popover-item update-item__popover-item--danger"
                          role="menuitem"
                          onClick={() => void handleDeletePost()}
                        >
                          Delete Post
                        </button>
                      )}
                    </>
                  )}

                  {!checkLoading &&
                    watchlistStep &&
                    watchlistOptions.map((opt) => (
                      <button
                        key={opt}
                        className="update-item__popover-item"
                        role="menuitem"
                        onClick={() => void handleWatchlistSelect(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="update-item__body">
          <button
            className="update-item__poster-btn"
            onClick={handleMediaClick}
            aria-label={`View ${update.media.title}`}
          >
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${update.media.title} poster`}
                className="update-item__poster"
              />
            ) : (
              <div className="update-item__poster update-item__poster--placeholder">
                {update.media.title.charAt(0)}
              </div>
            )}
          </button>

          <div className="update-item__content">
            <button className="update-item__media-title" onClick={handleMediaClick}>
              {update.media.title}
            </button>
            <p className="update-item__last-watched">Watched: {update.lastWatched}</p>
            <StarRating rating={update.rating} size="sm" />
            {update.description && (
              <p className="update-item__description">{update.description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        {!compact && (
          <div className="update-item__footer">
            <LikeButton
              type="update"
              id={update.id}
              likeCount={update.likeCount}
              isLikedByMe={update.isLikedByMe}
            />
            <CommentButton
              commentCount={commentCount}
              onClick={() => setCommentOpen(true)}
            />
          </div>
        )}
      </article>

      {commentOpen && (
        <UpdateComment
          update={update}
          updateId={update.id}
          onClose={() => setCommentOpen(false)}
          onCommentAdded={() => setCommentCount((c) => c + 1)}
        />
      )}
    </>
  );
}
