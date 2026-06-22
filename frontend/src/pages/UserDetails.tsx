import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { api } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { MediaItem } from '../components/MediaItem';
import { UpdateFeed } from '../components/UpdateFeed';
import { getPosterUrl } from '../lib/tmdb';
import { useAuth } from '../contexts/AuthContext';
import type { FollowStatus, LibraryMedia, UserSearchResult } from '../lib/types';
import './UserDetails.css';

interface UserProfile extends UserSearchResult {
  bio?: string | null;
}

interface UserStats {
  followerCount: number;
  followingCount: number;
  updateCount: number;
  mediaCount: number;
}

interface Watchlists {
  currentlyWatching: LibraryMedia[];
  wantToWatch: LibraryMedia[];
  hiatus: LibraryMedia[];
}

type AccordionKey = 'currentlyWatching' | 'wantToWatch' | 'hiatus';

const ACCORDION_LABELS: Record<AccordionKey, string> = {
  currentlyWatching: 'Currently Watching',
  wantToWatch: 'Want to Watch',
  hiatus: 'Hiatus',
};

function WatchlistCard({ media, onNavigate }: { media: LibraryMedia; onNavigate: () => void }) {
  const posterUrl = media.thumbnail
    ? media.thumbnail.startsWith('http')
      ? media.thumbnail
      : getPosterUrl(media.thumbnail, 'w92')
    : null;

  return (
    <div className="user-details__watchlist-card">
      {posterUrl ? (
        <img src={posterUrl} alt={`${media.title} poster`} className="user-details__watchlist-poster" />
      ) : (
        <div className="user-details__watchlist-poster user-details__watchlist-poster--placeholder">
          {media.title.charAt(0)}
        </div>
      )}
      <div className="user-details__watchlist-info">
        <span className="user-details__watchlist-title">{media.title}</span>
        {media.description && (
          <p className="user-details__watchlist-desc">{media.description}</p>
        )}
      </div>
      <button
        className="user-details__watchlist-nav-btn"
        onClick={onNavigate}
        aria-label={`View ${media.title}`}
      >
        <ArrowUpRight size={18} />
      </button>
    </div>
  );
}

export function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = me?.id === userId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlists | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<AccordionKey | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setIsLoading(true);
      try {
        const [profileRes, statsRes, watchlistsRes] = await Promise.allSettled([
          api.get<{ user: UserProfile }>(`/users/${userId}`),
          api.get<UserStats>(`/users/${userId}/stats`),
          api.get<Watchlists>(`/users/${userId}/watchlists`),
        ]);

        if (profileRes.status === 'fulfilled') {
          const p = profileRes.value.user;
          setProfile(p);
          setEditFirstName(p.firstName ?? '');
          setEditLastName(p.lastName ?? '');
          setEditBio(p.bio ?? '');
        }
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (watchlistsRes.status === 'fulfilled') setWatchlists(watchlistsRes.value);

        if (!isOwnProfile) {
          const statusRes = await api
            .get<FollowStatus>(`/users/${userId}/follow-status`)
            .catch(() => null);
          if (statusRes) setFollowStatus(statusRes);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [userId, isOwnProfile]);

  async function handleFollowToggle() {
    if (!userId || isFollowPending) return;
    const wasFollowing = followStatus?.isFollowing ?? false;
    setFollowStatus((prev) => prev ? { ...prev, isFollowing: !wasFollowing } : null);
    setIsFollowPending(true);
    try {
      if (wasFollowing) {
        await api.delete(`/users/${userId}/follow`);
      } else {
        await api.post(`/users/${userId}/follow`, {});
      }
    } catch {
      setFollowStatus((prev) => prev ? { ...prev, isFollowing: wasFollowing } : null);
    } finally {
      setIsFollowPending(false);
    }
  }

  async function handleSaveProfile() {
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      const { user: updated } = await api.put<{ user: UserProfile }>(`/users/${userId}`, {
        firstName: editFirstName,
        lastName: editLastName,
        bio: editBio,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch {
      // silently fail — user can retry
    } finally {
      setIsSaving(false);
    }
  }

  function handleWatchlistChange() {
    if (!userId) return;
    api
      .get<Watchlists>(`/users/${userId}/watchlists`)
      .then(setWatchlists)
      .catch(() => undefined);
  }

  function toggleAccordion(key: AccordionKey) {
    setExpandedAccordion((prev) => (prev === key ? null : key));
  }

  if (isLoading) {
    return (
      <div className="user-details">
        <div className="user-details__loading">Loading…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-details">
        <p className="user-details__error">User not found.</p>
      </div>
    );
  }

  return (
    <div className="user-details">
      {/* Profile header */}
      <div className="user-details__header">
        <Avatar
          src={profile.profilePicture}
          firstName={profile.firstName}
          lastName={profile.lastName}
          size={isOwnProfile ? 'xl' : 'lg'}
        />

        <div className="user-details__header-info">
          {isOwnProfile && !isEditing && (
            <button
              className="user-details__edit-btn"
              onClick={() => setIsEditing(true)}
              aria-label="Edit profile"
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}

          <h1 className="user-details__name">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="user-details__username">@{profile.username}</p>

          {profile.bio && (
            <p className="user-details__bio">{profile.bio}</p>
          )}

          {stats && (
            <div className="user-details__stats">
              <span className="user-details__stat">
                <strong>{stats.followerCount}</strong> followers
              </span>
              <span className="user-details__stat">
                <strong>{stats.followingCount}</strong> following
              </span>
              <span className="user-details__stat">
                <strong>{stats.mediaCount}</strong> titles
              </span>
            </div>
          )}

          {!isOwnProfile && followStatus && (
            <button
              className={`user-details__follow-btn${followStatus.isFollowing ? ' user-details__follow-btn--following' : ''}`}
              onClick={handleFollowToggle}
              disabled={isFollowPending}
              aria-label={
                followStatus.isFollowing
                  ? `Unfollow ${profile.firstName}`
                  : `Follow ${profile.firstName}`
              }
            >
              {followStatus.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className="user-details__edit-form">
          <div className="user-details__edit-row">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-first-name">First name</label>
              <input
                id="edit-first-name"
                className="form-input"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-last-name">Last name</label>
              <input
                id="edit-last-name"
                className="form-input"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-bio">Bio</label>
            <textarea
              id="edit-bio"
              className="form-input user-details__bio-input"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              placeholder="Tell people about yourself…"
            />
          </div>
          <div className="user-details__edit-actions">
            <button
              className="btn-primary"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              className="btn-ghost"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Watchlist accordion */}
      {watchlists && (
        <div className="user-details__watchlists">
          {(Object.keys(ACCORDION_LABELS) as AccordionKey[]).map((key) => {
            const items = watchlists[key];
            const isExpanded = expandedAccordion === key;

            return (
              <div key={key} className="user-details__accordion">
                <button
                  className={`user-details__accordion-header${isExpanded ? ' user-details__accordion-header--open' : ''}`}
                  onClick={() => toggleAccordion(key)}
                  aria-expanded={isExpanded}
                >
                  <span className="user-details__accordion-label">
                    {ACCORDION_LABELS[key]}
                  </span>
                  <span className="user-details__accordion-count">{items.length}</span>
                  {isExpanded ? (
                    <ChevronDown size={16} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={16} aria-hidden="true" />
                  )}
                </button>

                {isExpanded && (
                  <div className="user-details__accordion-body">
                    {items.length === 0 ? (
                      <p className="user-details__accordion-empty">Nothing here yet.</p>
                    ) : isOwnProfile ? (
                      items.map((media) => (
                        <MediaItem
                          key={media.id}
                          media={media}
                          onLibraryChange={handleWatchlistChange}
                        />
                      ))
                    ) : (
                      items.map((media) => (
                        <WatchlistCard
                          key={media.id}
                          media={media}
                          onNavigate={() => navigate(`/media/${media.tmdbId}?type=${media.mediaType}`)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* UpdateFeed */}
      <section className="user-details__feed-section">
        <h2 className="user-details__feed-heading">Updates</h2>
        <UpdateFeed userId={userId} />
      </section>
    </div>
  );
}
