import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/format';
import { Avatar } from './Avatar';
import { LikeButton } from './LikeButton';
import { useAuth } from '../contexts/AuthContext';
import type { CommentData } from '../lib/types';
import './CommentItem.css';

interface CommentItemProps {
  comment: CommentData;
  /** Called after the comment is successfully deleted */
  onDelete?: (commentId: number) => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnComment = user?.id === comment.user.id;

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/comments/${comment.id}`);
      onDelete?.(comment.id);
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <div className={`comment-item${isDeleting ? ' comment-item--deleting' : ''}`}>
      <Avatar
        src={comment.user.profilePicture}
        firstName={comment.user.firstName}
        lastName={comment.user.lastName}
        size="sm"
      />

      <div className="comment-item__body">
        <div className="comment-item__header">
          <span className="comment-item__author">
            {comment.user.firstName} {comment.user.lastName}
          </span>
          <span className="comment-item__timestamp">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        <p className="comment-item__text">{comment.text}</p>

        <div className="comment-item__footer">
          {!isOwnComment && (
            <LikeButton
              type="comment"
              id={comment.id}
              likeCount={comment.likeCount}
              isLikedByMe={comment.isLikedByMe}
            />
          )}

          {isOwnComment && (
            <button
              className="comment-item__delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete comment"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
