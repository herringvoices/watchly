import { getInitials } from '../lib/format';
import './Avatar.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, firstName, lastName, size = 'md', className = '' }: AvatarProps) {
  const label = `${firstName} ${lastName}`;

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`avatar avatar--${size} ${className}`}
      />
    );
  }

  return (
    <span
      className={`avatar avatar--${size} avatar--placeholder ${className}`}
      aria-label={label}
      role="img"
    >
      {getInitials(firstName, lastName)}
    </span>
  );
}
