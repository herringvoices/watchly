/** Returns a human-friendly relative timestamp ("Just now", "5 mins ago", "3d ago"). */
export function formatRelativeTime(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 30) return 'Just now';
  if (diffMins < 1) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Returns initials from a first + last name ("Jane Doe" → "JD"). */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}
