import { useCallback, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import { UserSearchItem } from '../components/UserSearchItem';
import type { FollowStatus, UserSearchResult } from '../lib/types';
import './UserSearch.css';

interface UserSearchEntry {
  user: UserSearchResult;
  isFollowing: boolean;
}

export function UserSearch() {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<UserSearchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setEntries([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await api.get<{ users: UserSearchResult[] }>(
        `/users/search?query=${encodeURIComponent(q)}`
      );

      // Fetch follow status for each result
      const withStatus = await Promise.all(
        data.users.map(async (user) => {
          const statusRes = await api
            .get<FollowStatus>(`/users/${user.id}/follow-status`)
            .catch(() => ({ isFollowing: false, isFollowedBy: false }));
          return { user, isFollowing: statusRes.isFollowing };
        })
      );
      setEntries(withStatus);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 400);
  }

  function handleFollowChange(userId: string, isFollowing: boolean) {
    setEntries((prev) =>
      prev.map((e) => (e.user.id === userId ? { ...e, isFollowing } : e))
    );
  }

  return (
    <div className="user-search">
      <h1 className="user-search__heading">User Search</h1>
      <label className="user-search__input-wrap" htmlFor="user-search-input">
        <Search size={18} className="user-search__input-icon" aria-hidden="true" />
        <input
          id="user-search-input"
          className="user-search__input"
          type="search"
          placeholder="Search people…"
          value={query}
          onChange={handleQueryChange}
          autoFocus
        />
      </label>

      <div className="user-search__results">
        {isLoading && <p className="user-search__empty">Searching…</p>}

        {!isLoading && hasSearched && entries.length === 0 && (
          <p className="user-search__empty">No users found for "{query}"</p>
        )}

        {!isLoading && !hasSearched && (
          <p className="user-search__empty">Search for people to follow.</p>
        )}

        {entries.map(({ user, isFollowing }) => (
          <UserSearchItem
            key={user.id}
            user={user}
            isFollowing={isFollowing}
            onFollowChange={handleFollowChange}
          />
        ))}
      </div>
    </div>
  );
}
