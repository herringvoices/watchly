import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { UpdateItem } from './UpdateItem';
import type { UpdateData } from '../lib/types';
import './UpdateFeed.css';

interface UpdateFeedProps {
  followingOnly?: boolean;
  mediaId?: number;
  userId?: string;
}

const PAGE_SIZE = 20;

export function UpdateFeed({ followingOnly, mediaId, userId }: UpdateFeedProps) {
  const [updates, setUpdates] = useState<UpdateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  function buildQuery(offset: number) {
    const params = new URLSearchParams();
    if (followingOnly) params.set('followingOnly', 'true');
    if (mediaId !== undefined) params.set('mediaId', String(mediaId));
    if (userId !== undefined) params.set('userId', userId);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(offset));
    return `/updates?${params.toString()}`;
  }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setUpdates([]);
    setHasMore(false);

    api
      .get<{ updates: UpdateData[]; hasMore: boolean }>(buildQuery(0))
      .then((data) => {
        if (!cancelled) {
          setUpdates(data.updates);
          setHasMore(data.hasMore);
        }
      })
      .catch(() => {
        if (!cancelled) setUpdates([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followingOnly, mediaId, userId]);

  async function loadMore() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await api.get<{ updates: UpdateData[]; hasMore: boolean }>(
        buildQuery(updates.length)
      );
      setUpdates((prev) => [...prev, ...data.updates]);
      setHasMore(data.hasMore);
    } catch {
      // silent
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleDeleted(updateId: number) {
    setUpdates((prev) => prev.filter((u) => u.id !== updateId));
  }

  if (isLoading) {
    return (
      <div className="update-feed">
        <p className="update-feed__empty">Loading…</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="update-feed">
        <p className="update-feed__empty">No updates yet.</p>
      </div>
    );
  }

  return (
    <div className="update-feed">
      <div className="update-feed__list">
        {updates.map((update) => (
          <UpdateItem key={update.id} update={update} onDeleted={handleDeleted} />
        ))}
      </div>

      {hasMore && (
        <button
          className="btn-ghost update-feed__load-more"
          onClick={() => void loadMore()}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
