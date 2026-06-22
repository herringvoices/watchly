import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import { CommentItem } from './CommentItem';
import { UpdateItem } from './UpdateItem';
import type { CommentData, UpdateData } from '../lib/types';
import './UpdateComment.css';

interface UpdateCommentProps {
  updateId: number;
  /** Pass the update to display the original post above comments. */
  update?: UpdateData;
  onClose: () => void;
  /** Called each time a new comment is successfully posted. */
  onCommentAdded?: () => void;
}

export function UpdateComment({ updateId, update, onClose, onCommentAdded }: UpdateCommentProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadComments() {
      setIsLoading(true);
      try {
        const data = await api.get<{ comments: CommentData[] }>(
          `/updates/${updateId}/comments`
        );
        setComments(data.comments);
      } catch {
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    }
    void loadComments();
  }, [updateId]);

  // Focus textarea after load
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = await api.post<{ comment: CommentData }>(
        `/updates/${updateId}/comments`,
        { text: newComment.trim() }
      );
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      onCommentAdded?.();
    } catch {
      // silently fail — user can retry
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteComment(commentId: number) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="update-comment-overlay" onClick={onClose}>
      <div
        className="update-comment"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
      >
        {/* Header */}
        <div className="update-comment__header">
          <h2 className="update-comment__title">Comments</h2>
          <button
            className="update-comment__close"
            onClick={onClose}
            aria-label="Close comments"
          >
            <X size={20} />
          </button>
        </div>

        {/* Original update */}
        {update && (
          <div className="update-comment__update-placeholder" aria-label="Original post">
            <UpdateItem update={update} compact />
          </div>
        )}

        {/* Comments list */}
        <div className="update-comment__comments">
          {isLoading && (
            <p className="update-comment__empty">Loading comments…</p>
          )}

          {!isLoading && comments.length === 0 && (
            <p className="update-comment__empty">
              No comments yet. Be the first!
            </p>
          )}

          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>

        {/* Post comment form */}
        <form className="update-comment__post-form" onSubmit={handleSubmitComment}>
          <textarea
            ref={textareaRef}
            className="update-comment__textarea"
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                void handleSubmitComment(e as unknown as React.FormEvent);
              }
            }}
          />
          <button
            type="submit"
            className="btn-primary update-comment__post-btn"
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Posting…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
