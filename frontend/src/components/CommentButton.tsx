import { MessageCircle } from 'lucide-react';
import './CommentButton.css';

interface CommentButtonProps {
  commentCount: number;
  onClick: () => void;
}

export function CommentButton({ commentCount, onClick }: CommentButtonProps) {
  return (
    <button
      className="comment-btn"
      onClick={onClick}
      aria-label={`${commentCount} comment${commentCount !== 1 ? 's' : ''}. Open comments.`}
    >
      <MessageCircle className="comment-btn-icon" />
      <span className="comment-btn-count">{commentCount}</span>
    </button>
  );
}
