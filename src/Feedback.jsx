import { useEffect, useRef, useState } from 'react';
import { Bug, Heart, Lightbulb, MessageSquare, Send, Star, X } from 'lucide-react';
import { API_BASE_URL } from './config';

export const FEEDBACK_CATEGORIES = [
  { key: 'suggestion', label: 'Suggestion', icon: Lightbulb },
  { key: 'bug', label: 'Problem / Bug', icon: Bug },
  { key: 'compliment', label: 'Compliment', icon: Heart },
  { key: 'other', label: 'Other', icon: MessageSquare },
];

const MAX = 1000;

// Volunteer / organizer feedback form. `token` is the logged-in user's token; `role` shows who is sending.
export default function FeedbackModal({ role, token, onClose }) {
  const [category, setCategory] = useState('suggestion');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // After the thank-you animation plays, the card fades out and closes by itself.
  useEffect(() => {
    if (!sent) return undefined;
    const fade = setTimeout(() => setLeaving(true), 2300);
    const close = setTimeout(() => closeRef.current?.(), 2600);
    return () => { clearTimeout(fade); clearTimeout(close); };
  }, [sent]);

  const submit = async (event) => {
    event.preventDefault();
    if (rating < 1) return setError('Please choose a star rating.');
    if (message.trim().length < 10) return setError('Please write at least 10 characters.');
    setError('');
    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, rating, message: message.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not send your feedback.');
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`eco-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 ${leaving ? 'feedback-leave' : ''}`} onClick={onClose}>
      <div className="eco-modal feedback-panel w-full max-w-md" role="dialog" aria-modal="true" aria-label="Send feedback" onClick={(e) => e.stopPropagation()}>
        {!sent && (
          <div className="flex items-start justify-between gap-3 border-b border-eco-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="eco-icon-tile feedback-icon h-10 w-10 rounded-xl"><MessageSquare className="h-5 w-5" /></span>
              <div>
                <h3 className="text-base font-extrabold text-eco-900">Send feedback</h3>
                <p className="text-xs text-slate-500">Help us make EcoTask better.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
        )}

        {sent ? (
          <div className="px-5 py-14 text-center">
            <div className="relative mx-auto h-16 w-16">
              <span className="feedback-ring absolute inset-0 rounded-full border-2 border-eco-400" />
              <svg viewBox="0 0 64 64" className="relative h-16 w-16" fill="none" aria-hidden="true">
                <circle className="feedback-check-circle" cx="32" cy="32" r="28" stroke="#2e7d32" strokeWidth="4" strokeLinecap="round" transform="rotate(-90 32 32)" />
                <path className="feedback-check-tick" d="M19 33 l9 9 l17 -19" stroke="#2e7d32" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="feedback-rise mt-4 text-base font-extrabold text-eco-900">Thank you!</h4>
            <p className="feedback-rise mt-1 text-sm text-slate-500">Your feedback was sent to the EcoTask admin.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 px-5 py-4">
            <div className="feedback-item" style={{ animationDelay: '150ms' }}>
              <p className="eco-label">What is it about?</p>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_CATEGORIES.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setCategory(key)} className={`eco-chip px-3 py-1.5 ${category === key ? 'eco-chip-active' : ''}`}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="feedback-item" style={{ animationDelay: '230ms' }}>
              <p className="eco-label">How is your experience?</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? '' : 's'}`} onClick={() => setRating(n)} className="rounded-lg p-1 transition hover:scale-110">
                    <Star
                      key={n <= rating ? `on-${rating}` : 'off'}
                      style={n <= rating ? { animationDelay: `${(n - 1) * 60}ms` } : undefined}
                      className={`h-7 w-7 ${n <= rating ? 'feedback-star-on fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="feedback-item" style={{ animationDelay: '310ms' }}>
              <label className="eco-label" htmlFor="feedback-message">Your message *</label>
              <textarea id="feedback-message" rows={4} maxLength={MAX} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's working, what's not, or what you'd like to see." className="eco-input resize-none" />
              <p className="mt-1 text-right text-[11px] text-slate-400">{message.length}/{MAX}</p>
            </div>

            <p className="feedback-item rounded-xl bg-eco-50 px-3 py-2 text-xs text-eco-800" style={{ animationDelay: '380ms' }}>The admin will see your name and that you are {role === 'organizer' ? 'an organizer' : 'a volunteer'}.</p>
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

            <div className="feedback-item flex justify-end gap-2 border-t border-eco-100 pt-4" style={{ animationDelay: '440ms' }}>
              <button type="button" onClick={onClose} className="eco-btn eco-btn-secondary">Cancel</button>
              <button type="submit" disabled={sending} className="eco-btn eco-btn-primary"><Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send feedback'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
