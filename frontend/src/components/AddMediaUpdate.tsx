import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { MediaItem } from './MediaItem';
import { getPosterUrl } from '../lib/tmdb';
import type { LibraryMedia, WatchSessionLength } from '../lib/types';
import './AddMediaUpdate.css';

interface AddMediaUpdateProps {
  onClose: () => void;
}

type Step = 'select' | 'form';

const SESSION_OPTIONS: { value: WatchSessionLength; label: string }[] = [
  { value: 'Short', label: 'Short' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Long', label: 'Long' },
];

export function AddMediaUpdate({ onClose }: AddMediaUpdateProps) {
  const navigate = useNavigate();

  // Step 1 state
  const [step, setStep] = useState<Step>('select');
  const [library, setLibrary] = useState<{
    currentlyWatching: LibraryMedia[];
    wantToWatch: LibraryMedia[];
    hiatus: LibraryMedia[];
  } | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<LibraryMedia | null>(null);

  // Step 2 form state
  const [lastWatched, setLastWatched] = useState('');
  const [sessionLength, setSessionLength] = useState<WatchSessionLength | ''>('');
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function loadLibrary() {
      setIsLoadingLibrary(true);
      try {
        const data = await api.get<{
          currentlyWatching: LibraryMedia[];
          wantToWatch: LibraryMedia[];
          hiatus: LibraryMedia[];
        }>('/media');
        setLibrary(data);
      } catch {
        setLibrary(null);
      } finally {
        setIsLoadingLibrary(false);
      }
    }
    void loadLibrary();
  }, []);

  function handleSelectMedia(media: LibraryMedia) {
    setSelectedMedia(media);
    setLastWatched('');
    setSessionLength('Medium');
    setRating(0);
    setDescription('');
    setFormError('');
    setStep('form');
  }

  function handleLibraryChange() {
    // Reload library after move/remove
    api
      .get<{
        currentlyWatching: LibraryMedia[];
        wantToWatch: LibraryMedia[];
        hiatus: LibraryMedia[];
      }>('/media')
      .then(setLibrary)
      .catch(() => undefined);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedMedia) return;
    if (!lastWatched.trim()) {
      setFormError('Please describe what you watched.');
      return;
    }
    if (!sessionLength) {
      setFormError('Please select a session length.');
      return;
    }
    if (rating === 0) {
      setFormError('Please select a rating.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await api.post('/updates', {
        mediaId: selectedMedia.id,
        lastWatched: lastWatched.trim(),
        description: description.trim() || undefined,
        rating,
        watchSessionLength: sessionLength as WatchSessionLength,
      });
      onClose();
      navigate('/');
    } catch {
      setFormError('Failed to save update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasAnyMedia = library
    ? library.currentlyWatching.length + library.wantToWatch.length + library.hiatus.length > 0
    : false;

  const posterUrl = selectedMedia?.thumbnail
    ? selectedMedia.thumbnail.startsWith('http')
      ? selectedMedia.thumbnail
      : getPosterUrl(selectedMedia.thumbnail, 'w92')
    : null;

  return (
    <div className="add-media-update-overlay" onClick={onClose}>
      <div
        className="add-media-update"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={step === 'select' ? 'Select media' : 'Add update'}
      >
        {/* ── Step 1: Select Media ── */}
        {step === 'select' && (
          <>
            <div className="add-media-update__header">
              <h2 className="add-media-update__title">Select Media</h2>
              <button
                className="add-media-update__close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="add-media-update__body">
              {isLoadingLibrary && (
                <p className="add-media-update__empty">Loading your library…</p>
              )}

              {!isLoadingLibrary && !hasAnyMedia && (
                <p className="add-media-update__empty">
                  Your library is empty. Add some titles from Search first.
                </p>
              )}

              {library && library.currentlyWatching.length > 0 && (
                <div className="add-media-update__section">
                  <h3 className="add-media-update__section-heading">Currently Watching</h3>
                  {library.currentlyWatching.map((media) => (
                    <MediaItem
                      key={media.id}
                      media={media}
                      onSelect={() => handleSelectMedia(media)}
                      onLibraryChange={handleLibraryChange}
                    />
                  ))}
                </div>
              )}

              {library && library.wantToWatch.length > 0 && (
                <div className="add-media-update__section">
                  <h3 className="add-media-update__section-heading">Want to Watch</h3>
                  {library.wantToWatch.map((media) => (
                    <MediaItem
                      key={media.id}
                      media={media}
                      onSelect={() => handleSelectMedia(media)}
                      onLibraryChange={handleLibraryChange}
                    />
                  ))}
                </div>
              )}

              {library && library.hiatus.length > 0 && (
                <div className="add-media-update__section">
                  <h3 className="add-media-update__section-heading">Hiatus</h3>
                  {library.hiatus.map((media) => (
                    <MediaItem
                      key={media.id}
                      media={media}
                      onSelect={() => handleSelectMedia(media)}
                      onLibraryChange={handleLibraryChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Update Form ── */}
        {step === 'form' && selectedMedia && (
          <>
            <div className="add-media-update__header">
              <button
                className="add-media-update__back"
                onClick={() => setStep('select')}
                aria-label="Back to media selection"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="add-media-update__title">Add Update</h2>
              <button
                className="add-media-update__close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="add-media-update__body">
              {/* Selected media info */}
              <div className="add-media-update__selected-media">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={`${selectedMedia.title} poster`}
                    className="add-media-update__selected-poster"
                  />
                ) : (
                  <div className="add-media-update__selected-poster add-media-update__selected-poster--placeholder">
                    {selectedMedia.title.charAt(0)}
                  </div>
                )}
                <div className="add-media-update__selected-info">
                  <span className="add-media-update__selected-title">
                    {selectedMedia.title}
                  </span>
                </div>
              </div>

              <form className="add-media-update__form" onSubmit={handleSubmit}>
                {/* What did you watch */}
                <div className="form-group">
                  <label className="form-label" htmlFor="last-watched">
                    What have you watched since your last update?
                  </label>
                  <textarea
                    id="last-watched"
                    className="form-input add-media-update__textarea"
                    rows={3}
                    placeholder="Enter answer here…"
                    value={lastWatched}
                    onChange={(e) => setLastWatched(e.target.value)}
                    required
                  />
                </div>

                {/* Session length */}
                <div className="form-group">
                  <label className="form-label" htmlFor="session-length">
                    How long was this viewing stretch?
                  </label>
                  <select
                    id="session-length"
                    className="form-input"
                    value={sessionLength}
                    onChange={(e) => setSessionLength((e.target as HTMLSelectElement).value as WatchSessionLength | '')}
                  >
                    <option value="">Select an option</option>
                    {SESSION_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div className="form-group">
                  <label className="form-label">How would you rate what you just watched?</label>
                  <div className="add-media-update__stars" role="group" aria-label="Select rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`add-media-update__star-btn${n <= rating ? ' add-media-update__star-btn--filled' : ''}`}
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                      >
                        <Star size={22} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label" htmlFor="update-description">
                    Anything else you'd like to add? <span className="add-media-update__optional">(optional)</span>
                  </label>
                  <textarea
                    id="update-description"
                    className="form-input add-media-update__textarea"
                    rows={3}
                    placeholder="Share your thoughts…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {formError && <p className="form-error">{formError}</p>}

                <button
                  type="submit"
                  className="btn-primary add-media-update__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting…' : 'Post Update'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
