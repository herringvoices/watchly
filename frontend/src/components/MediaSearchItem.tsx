import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { getPosterUrl } from '../lib/tmdb';
import { StarRating } from './StarRating';
import type { MediaType } from '../lib/types';
import './MediaSearchItem.css';

const WATCHLIST_OPTIONS = ['Currently Watching', 'Want to Watch'] as const;
type AddableWatchlist = (typeof WATCHLIST_OPTIONS)[number];

interface MediaSearchItemProps {
  tmdbId: number;
  title: string;
  overview?: string;
  /** Path string from TMDB (e.g. "/abc123.jpg") or full thumbnail URL from library */
  posterPath?: string | null;
  mediaType: MediaType;
  /** Pre-fetched sitewide rating — omit to hide rating section */
  sitewideRating?: number | null;
  sitewideRatingCount?: number;
  /** Whether current user already has this in their library */
  inLibrary?: boolean;
  currentWatchlist?: string | null;
  /** Internal mediaId — required when inLibrary is true to call move/remove */
  mediaId?: number | null;
  /** Called after a successful add/move so parent can refresh state */
  onLibraryChange?: () => void;
}

export function MediaSearchItem({
  tmdbId,
  title,
  overview,
  posterPath,
  mediaType,
  sitewideRating,
  sitewideRatingCount,
  inLibrary = false,
  currentWatchlist,
  mediaId,
  onLibraryChange,
}: MediaSearchItemProps) {
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Determine available watchlist options (exclude current when moving)
  const options: string[] = inLibrary
    ? ['Currently Watching', 'Want to Watch', 'Hiatus'].filter((w) => w !== currentWatchlist)
    : [...WATCHLIST_OPTIONS];

  const posterUrl = posterPath?.startsWith('http')
    ? posterPath
    : getPosterUrl(posterPath, 'w185');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  async function handleWatchlistSelect(watchlist: string) {
    setPopoverOpen(false);
    setIsAdding(true);
    try {
      if (inLibrary && mediaId) {
        await api.put(`/media/${mediaId}/watchlist`, { watchlist });
      } else {
        await api.post('/media', { tmdbId, mediaType, watchlist });
      }
      onLibraryChange?.();
      navigate(`/media/${tmdbId}?type=${mediaType}`);
    } catch {
      // error silently — parent can handle refresh
    } finally {
      setIsAdding(false);
    }
  }

  function handleCardClick() {
    navigate(`/media/${tmdbId}?type=${mediaType}`);
  }

  return (
    <div className="media-search-item">
      {/* Poster */}
      <button className="media-search-item__poster-btn" onClick={handleCardClick} aria-label={`View ${title}`}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${title} poster`}
            className="media-search-item__poster"
          />
        ) : (
          <div className="media-search-item__poster media-search-item__poster--placeholder">
            <span>{title.charAt(0)}</span>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="media-search-item__info">
        <button className="media-search-item__title" onClick={handleCardClick}>
          {title}
        </button>

        {sitewideRating !== undefined && (
          <StarRating rating={sitewideRating} count={sitewideRatingCount} size="sm" />
        )}

        {overview && (
          <p className="media-search-item__overview">{overview}</p>
        )}
      </div>

      {/* Add / Move button */}
      <div className="media-search-item__action" ref={popoverRef}>
        <button
          className={`btn-secondary media-search-item__add-btn${isAdding ? ' media-search-item__add-btn--loading' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setPopoverOpen((o) => !o);
          }}
          disabled={isAdding}
          aria-label={inLibrary ? 'Move to watchlist' : 'Add to watchlist'}
          aria-expanded={popoverOpen}
        >
          {inLibrary ? (
            <>
              Move <ChevronDown size={14} />
            </>
          ) : (
            <>
              <Plus size={14} /> Add
            </>
          )}
        </button>

        {popoverOpen && (
          <div className="media-search-item__popover" role="menu">
            {options.map((option) => (
              <button
                key={option}
                className="media-search-item__popover-item"
                onClick={() => handleWatchlistSelect(option)}
                role="menuitem"
              >
                {option}
              </button>
            ))}
            {inLibrary && mediaId && (
              <button
                className="media-search-item__popover-item media-search-item__popover-item--danger"
                onClick={async () => {
                  setPopoverOpen(false);
                  setIsAdding(true);
                  try {
                    await api.delete(`/media/${mediaId}`);
                    onLibraryChange?.();
                  } finally {
                    setIsAdding(false);
                  }
                }}
                role="menuitem"
              >
                Remove from Watchlist
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
