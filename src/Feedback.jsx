import { useState } from 'react';
import { Bug, Heart, Lightbulb, MessageSquare, Send, Star, X, CheckCircle2 } from 'lucide-react';
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
    <div className="eco-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="eco-modal w-full max-w-md" role="dialog" aria-modal="true" aria-label="Send feedback" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-eco-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="eco-icon-tile h-10 w-10 rounded-xl"><MessageSquare className="h-5 w-5" /></span>
            <div>
              <h3 className="text-base font-extrabold text-eco-900">Send feedback</h3>
              <p className="text-xs text-slate-500">Help us make EcoTask better.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        {sent ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-eco-600" />
            <h4 className="mt-3 text-base font-extrabold text-eco-900">Thank you!</h4>
            <p className="mt-1 text-sm text-slate-500">Your feedback was sent to the EcoTask admin.</p>
            <button type="button" onClick={onClose} className="eco-btn eco-btn-primary mt-5">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 px-5 py-4">
            <div>
              <p className="eco-label">What is it about?</p>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_CATEGORIES.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setCategory(key)} className={`eco-chip px-3 py-1.5 ${category === key ? 'eco-chip-active' : ''}`}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eco-label">How is your experience?</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? '' : 's'}`} onClick={() => setRating(n)} className="rounded-lg p-1 transition hover:scale-110">
                    <Star className={`h-7 w-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="eco-label" htmlFor="feedback-message">Your message *</label>
              <textarea id="feedback-message" rows={4} maxLength={MAX} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's working, what's not, or what you'd like to see." className="eco-input resize-none" />
              <p className="mt-1 text-right text-[11px] text-slate-400">{message.length}/{MAX}</p>
            </div>

            <p className="rounded-xl bg-eco-50 px-3 py-2 text-xs text-eco-800">The admin will see your name and that you are {role === 'organizer' ? 'an organizer' : 'a volunteer'}.</p>
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-eco-100 pt-4">
              <button type="button" onClick={onClose} className="eco-btn eco-btn-secondary">Cancel</button>
              <button type="submit" disabled={sending} className="eco-btn eco-btn-primary"><Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send feedback'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
