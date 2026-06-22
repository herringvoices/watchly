// ── Media ───────────────────────────────────────────────────────

export type MediaType = 'movie' | 'tv';

export type MediaStatus = 'CurrentlyWatching' | 'WantToWatch' | 'Hiatus';

export type WatchSessionLength = 'Short' | 'Medium' | 'Long';

/** Shape returned by GET /tmdb/search */
export interface TmdbSearchResult {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  mediaType: MediaType;
  releaseDate?: string;
}

/** User's personal library entry — GET /media, GET /users/:userId/watchlists */
export interface LibraryMedia {
  id: number;
  tmdbId: number;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  rating?: number | null;
  mediaStatus: MediaStatus;
  mediaType: MediaType;
  lastWatched?: string | null;
}

/** Response from GET /media/check/:tmdbId */
export interface MediaCheckResult {
  inLibrary: boolean;
  watchlist: string | null;
  userRating: number | null;
  mediaId: number | null;
}

/** Sitewide rating from GET /ratings/:tmdbId */
export interface SitewideRating {
  tmdbId: number;
  type: MediaType;
  rating: number | null;
  numberOfRatings: number;
}

// ── Users ────────────────────────────────────────────────────────

/** Shape returned by GET /users/search */
export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture?: string | null;
  currentlyWatching?: {
    title: string;
    posterPath?: string | null;
  } | null;
}

/** Response from GET /users/:userId/follow-status */
export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

// ── Updates ──────────────────────────────────────────────────────

/** Shape returned by GET /updates */
export interface UpdateData {
  id: number;
  mediaId: number;
  userId: string;
  lastWatched: string;
  description?: string | null;
  rating: number;
  watchSessionLength: WatchSessionLength;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture?: string | null;
  };
  media: {
    id: number;
    tmdbId: number;
    title: string;
    thumbnail?: string | null;
    mediaType: MediaType;
  };
}

// ── Comments ─────────────────────────────────────────────────────

/** Shape returned by GET /updates/:updateId/comments */
export interface CommentData {
  id: number;
  updateId: number;
  text: string;
  createdAt: string;
  likeCount: number;
  isLikedByMe: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture?: string | null;
  };
}
