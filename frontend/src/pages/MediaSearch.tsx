import { useCallback, useRef, useState } from 'react';
import { Film, Search, Tv } from 'lucide-react';
import { api } from '../lib/api';
import { MediaSearchItem } from '../components/MediaSearchItem';
import type { MediaCheckResult, MediaType, SitewideRating, TmdbSearchResult } from '../lib/types';
import './MediaSearch.css';

export function MediaSearch() {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('tv');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [ratings, setRatings] = useState<Record<number, SitewideRating>>({});
  const [libraryStatus, setLibraryStatus] = useState<Record<number, MediaCheckResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enrichResults = useCallback(async (items: TmdbSearchResult[]) => {
    const settled = await Promise.all(
      items.map(async (item) => {
        const [ratingRes, libRes] = await Promise.allSettled([
          api.get<SitewideRating>(`/ratings/${item.tmdbId}?type=${item.mediaType}`),
          api.get<MediaCheckResult>(`/media/check/${item.tmdbId}?type=${item.mediaType}`),
        ]);
        return {
          tmdbId: item.tmdbId,
          rating: ratingRes.status === 'fulfilled' ? ratingRes.value : null,
          library: libRes.status === 'fulfilled' ? libRes.value : null,
        };
      })
    );

    const newRatings: Record<number, SitewideRating> = {};
    const newLib: Record<number, MediaCheckResult> = {};
    for (const { tmdbId, rating, library } of settled) {
      if (rating) newRatings[tmdbId] = rating;
      if (library) newLib[tmdbId] = library;
    }
    setRatings(newRatings);
    setLibraryStatus(newLib);
  }, []);

  const doSearch = useCallback(
    async (q: string, type: MediaType) => {
      if (!q.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setIsLoading(true);
      setHasSearched(true);
      try {
        const data = await api.get<{ results: TmdbSearchResult[] }>(
          `/tmdb/search?query=${encodeURIComponent(q)}&type=${type}`
        );
        setResults(data.results);
        void enrichResults(data.results);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [enrichResults]
  );

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q, mediaType), 400);
  }

  function handleTypeChange(type: MediaType) {
    if (type === mediaType) return;
    setMediaType(type);
    if (query.trim()) doSearch(query, type);
  }

  function handleLibraryChange() {
    if (results.length > 0) void enrichResults(results);
  }

  return (
    <div className="media-search">
      <h1 className="media-search__heading">Media Search</h1>
      <div className="media-search__controls">
        <div className="media-search__toggle">
          <button
            className={`media-search__toggle-btn${mediaType === 'tv' ? ' media-search__toggle-btn--active' : ''}`}
            onClick={() => handleTypeChange('tv')}
          >
            <Tv size={16} aria-hidden="true" />
            TV
          </button>
          <button
            className={`media-search__toggle-btn${mediaType === 'movie' ? ' media-search__toggle-btn--active' : ''}`}
            onClick={() => handleTypeChange('movie')}
          >
            <Film size={16} aria-hidden="true" />
            Movies
          </button>
        </div>

        <label className="media-search__input-wrap" htmlFor="media-search-input">
          <Search size={18} className="media-search__input-icon" aria-hidden="true" />
          <input
            id="media-search-input"
            className="media-search__input"
            type="search"
            placeholder={`Search ${mediaType === 'tv' ? 'TV shows' : 'movies'}…`}
            value={query}
            onChange={handleQueryChange}
            autoFocus
          />
        </label>
      </div>

      <div className="media-search__results">
        {isLoading && <p className="media-search__empty">Searching…</p>}

        {!isLoading && hasSearched && results.length === 0 && (
          <p className="media-search__empty">No results for "{query}"</p>
        )}

        {!isLoading && !hasSearched && (
          <p className="media-search__empty">
            Search for {mediaType === 'tv' ? 'TV shows' : 'movies'} to add to your watchlist.
          </p>
        )}

        {results.map((item) => {
          const r = ratings[item.tmdbId];
          const l = libraryStatus[item.tmdbId];
          return (
            <MediaSearchItem
              key={item.tmdbId}
              tmdbId={item.tmdbId}
              title={item.title}
              overview={item.overview}
              posterPath={item.posterPath}
              mediaType={item.mediaType}
              sitewideRating={r?.rating}
              sitewideRatingCount={r?.numberOfRatings}
              inLibrary={l?.inLibrary ?? false}
              currentWatchlist={l?.watchlist ?? null}
              mediaId={l?.mediaId ?? null}
              onLibraryChange={handleLibraryChange}
            />
          );
        })}
      </div>
    </div>
  );
}
