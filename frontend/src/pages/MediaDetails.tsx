import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { StarRating } from '../components/StarRating';
import { UpdateFeed } from '../components/UpdateFeed';
import { getBackdropUrl, getPosterUrl } from '../lib/tmdb';
import type { MediaCheckResult, MediaType, SitewideRating } from '../lib/types';
import './MediaDetails.css';

interface TmdbDetails {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  genres?: { id: number; name: string }[];
}

export function MediaDetails() {
  const { tmdbId } = useParams<{ tmdbId: string }>();
  const [searchParams] = useSearchParams();
  const mediaType = (searchParams.get('type') as MediaType | null) ?? 'movie';

  const [details, setDetails] = useState<TmdbDetails | null>(null);
  const [sitewideRating, setSitewideRating] = useState<SitewideRating | null>(null);
  const [checkResult, setCheckResult] = useState<MediaCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tmdbId) return;

    async function load() {
      setIsLoading(true);
      try {
        const [detailsRes, ratingRes, checkRes] = await Promise.allSettled([
          api.get<TmdbDetails>(`/tmdb/${mediaType}/${tmdbId}`),
          api.get<SitewideRating>(`/ratings/${tmdbId}?type=${mediaType}`),
          api.get<MediaCheckResult>(`/media/check/${tmdbId}?type=${mediaType}`),
        ]);
        if (detailsRes.status === 'fulfilled') setDetails(detailsRes.value);
        if (ratingRes.status === 'fulfilled') setSitewideRating(ratingRes.value);
        if (checkRes.status === 'fulfilled') setCheckResult(checkRes.value);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [tmdbId, mediaType]);

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
    if (!tmdbId) return;
    setPopoverOpen(false);
    setIsUpdating(true);
    try {
      if (checkResult?.inLibrary && checkResult.mediaId) {
        await api.put(`/media/${checkResult.mediaId}/watchlist`, { watchlist });
      } else {
        await api.post('/media', { tmdbId: Number(tmdbId), mediaType, watchlist });
      }
      const updated = await api.get<MediaCheckResult>(`/media/check/${tmdbId}?type=${mediaType}`);
      setCheckResult(updated);
    } catch {
      // silently fail — user can retry
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemove() {
    if (!checkResult?.mediaId) return;
    setPopoverOpen(false);
    setIsUpdating(true);
    try {
      await api.delete(`/media/${checkResult.mediaId}`);
      const updated = await api.get<MediaCheckResult>(`/media/check/${tmdbId}?type=${mediaType}`);
      setCheckResult(updated);
    } catch {
      // silently fail
    } finally {
      setIsUpdating(false);
    }
  }

  const watchlistOptions = checkResult?.inLibrary
    ? ['Currently Watching', 'Want to Watch', 'Hiatus'].filter(
        (w) => w !== checkResult.watchlist
      )
    : ['Currently Watching', 'Want to Watch'];

  const posterUrl = getPosterUrl(details?.posterPath, 'w342');
  const backdropUrl = getBackdropUrl(details?.backdropPath);

  if (isLoading) {
    return (
      <div className="media-details">
        <div className="media-details__loading">Loading…</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="media-details">
        <p className="media-details__error">Media not found.</p>
      </div>
    );
  }

  return (
    <div className="media-details">
      {/* Backdrop */}
      {backdropUrl && (
        <div
          className="media-details__backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
          aria-hidden="true"
        />
      )}

      {/* Hero */}
      <div className="media-details__hero">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${details.title} poster`}
            className="media-details__poster"
          />
        ) : (
          <div className="media-details__poster media-details__poster--placeholder">
            {details.title.charAt(0)}
          </div>
        )}

        <div className="media-details__info">
          <h1 className="media-details__title">{details.title}</h1>

          {details.releaseDate && (
            <p className="media-details__year">
              {new Date(details.releaseDate).getFullYear()}
            </p>
          )}

          {details.genres && details.genres.length > 0 && (
            <p className="media-details__genres">
              {details.genres.map((g) => g.name).join(' · ')}
            </p>
          )}

          <div className="media-details__ratings">
            <div>
              <p className="media-details__rating-label">Sitewide</p>
              <StarRating
                rating={sitewideRating?.rating ?? null}
                count={sitewideRating?.numberOfRatings}
                size="sm"
              />
            </div>

            {checkResult?.inLibrary && checkResult.userRating !== null && (
              <div>
                <p className="media-details__rating-label">Your rating</p>
                <StarRating rating={checkResult.userRating} size="sm" />
              </div>
            )}
          </div>

          {/* Watchlist action */}
          <div className="media-details__watchlist-action" ref={popoverRef}>
            <button
              className={`btn-primary media-details__watchlist-btn${isUpdating ? ' media-details__watchlist-btn--loading' : ''}`}
              onClick={() => setPopoverOpen((o) => !o)}
              disabled={isUpdating}
              aria-expanded={popoverOpen}
            >
              {checkResult?.inLibrary
                ? `Move · ${checkResult.watchlist}`
                : 'Add to Watchlist'}
              <ChevronDown size={14} />
            </button>

            {popoverOpen && (
              <div className="media-details__popover" role="menu">
                {watchlistOptions.map((option) => (
                  <button
                    key={option}
                    className="media-details__popover-item"
                    onClick={() => handleWatchlistSelect(option)}
                    role="menuitem"
                  >
                    {option}
                  </button>
                ))}
                {checkResult?.inLibrary && (
                  <button
                    className="media-details__popover-item media-details__popover-item--danger"
                    onClick={handleRemove}
                    role="menuitem"
                  >
                    Remove from Watchlist
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview */}
      {details.overview && (
        <section className="media-details__overview">
          <p>{details.overview}</p>
        </section>
      )}

      {/* UpdateFeed */}
      <section className="media-details__feed-section">
        <h2 className="media-details__feed-heading">Updates</h2>
        {checkResult?.mediaId && (
          <UpdateFeed mediaId={checkResult.mediaId} />
        )}
      </section>
    </div>
  );
}
