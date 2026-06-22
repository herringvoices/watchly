import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { getPosterUrl } from '../lib/tmdb';
import { StarRating } from './StarRating';
import type { LibraryMedia, MediaStatus } from '../lib/types';
import './MediaItem.css';

const ALL_STATUSES: MediaStatus[] = ['CurrentlyWatching', 'WantToWatch', 'Hiatus'];

const STATUS_LABEL: Record<MediaStatus, string> = {
  CurrentlyWatching: 'Currently Watching',
  WantToWatch: 'Want to Watch',
  Hiatus: 'Hiatus',
};

interface MediaItemProps {
  media: LibraryMedia;
  /** Called when user clicks the card body — e.g. to select for AddMediaUpdate step 2 */
  onSelect?: () => void;
  /** Called after a successful move/remove so the parent list can refresh */
  onLibraryChange?: () => void;
}

export function MediaItem({ media, onSelect, onLibraryChange }: MediaItemProps) {
  const [isPending, setIsPending] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const availableStatuses = ALL_STATUSES.filter((s) => s !== media.mediaStatus);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  async function handleMove(newStatus: MediaStatus) {
    setPopoverOpen(false);
    setIsPending(true);
    try {
      await api.put(`/media/${media.id}/watchlist`, { watchlist: STATUS_LABEL[newStatus] });
      onLibraryChange?.();
    } finally {
      setIsPending(false);
    }
  }

  async function handleRemove() {
    setPopoverOpen(false);
    setIsPending(true);
    try {
      await api.delete(`/media/${media.id}`);
      onLibraryChange?.();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={`media-item${isPending ? ' media-item--pending' : ''}`}>
      {/* Poster + info — clickable to select */}
      <button
        className="media-item__body"
        onClick={onSelect}
        disabled={!onSelect}
        aria-label={`Select ${media.title}`}
      >
        {media.thumbnail ? (
          <img
            src={media.thumbnail.startsWith('http') ? media.thumbnail : getPosterUrl(media.thumbnail, 'w92') ?? undefined}
            alt={`${media.title} poster`}
            className="media-item__poster"
          />
        ) : (
          <div className="media-item__poster media-item__poster--placeholder">
            {media.title.charAt(0)}
          </div>
        )}

        <div className="media-item__info">
          <span className="media-item__title">{media.title}</span>

          <span className="media-item__status">
            {STATUS_LABEL[media.mediaStatus]}
          </span>

          {media.lastWatched && (
            <span className="media-item__last-watched">
              Last watched: {media.lastWatched}
            </span>
          )}

          <StarRating rating={media.rating ?? null} size="sm" />
        </div>
      </button>

      {/* Move button */}
      <div className="media-item__actions" ref={popoverRef}>
        <button
          className="btn-ghost media-item__move-btn"
          onClick={(e) => {
            e.stopPropagation();
            setPopoverOpen((o) => !o);
          }}
          disabled={isPending}
          aria-label="Move or remove"
          aria-expanded={popoverOpen}
        >
          Move <ChevronDown size={14} />
        </button>

        {popoverOpen && (
          <div className="media-item__popover" role="menu">
            {availableStatuses.map((s) => (
              <button
                key={s}
                className="media-item__popover-item"
                onClick={() => handleMove(s)}
                role="menuitem"
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            <button
              className="media-item__popover-item media-item__popover-item--danger"
              onClick={handleRemove}
              role="menuitem"
            >
              Remove from Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
