import { UpdateFeed } from '../components/UpdateFeed';

export function Feed() {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text-dark-primary)' }}>
        Your Feed
      </h2>
      <UpdateFeed followingOnly />
    </div>
  );
}
