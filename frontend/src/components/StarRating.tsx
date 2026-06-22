import { Star } from 'lucide-react';
import './StarRating.css';

interface StarRatingProps {
  /** Rating value 1–5 (can be fractional for averages). Pass null for "no rating". */
  rating: number | null;
  /** Number of ratings to show alongside the stars (optional). */
  count?: number;
  size?: 'sm' | 'md';
}

const TOTAL = 5;

export function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  if (rating === null) {
    return (
      <span className={`star-rating star-rating--${size} star-rating--empty`}>
        {Array.from({ length: TOTAL }, (_, i) => (
          <Star key={i} className="star star--empty" />
        ))}
        {count !== undefined && (
          <span className="star-rating-count">No ratings</span>
        )}
      </span>
    );
  }

  const rounded = Math.round(rating);

  return (
    <span className={`star-rating star-rating--${size}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <Star key={i} className={i < rounded ? 'star star--filled' : 'star star--empty'} />
      ))}
      {count !== undefined && (
        <span className="star-rating-count">({count})</span>
      )}
    </span>
  );
}
