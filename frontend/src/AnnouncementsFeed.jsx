import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config';

/* =========================================================
   ANNOUNCEMENTS FEED (volunteer + organizer pages)
   The server only returns what this role may see:
     volunteers -> Volunteer + General, organizers -> Organizer + General.

   Props:
     storageKey - "userInfo" (volunteer) or "organizerInfo" (organizer)
     audience   - "Volunteer" or "Organizer"
========================================================= */

const BADGE = {
  Volunteer: { label: 'For volunteers', className: 'eco-badge eco-badge-green', bar: 'from-eco-400 to-eco-700' },
  Organizer: { label: 'For organizers', className: 'eco-badge eco-badge-blue', bar: 'from-sky-300 to-sky-600' },
  General: { label: 'General', className: 'eco-badge border border-violet-200 bg-violet-50 text-violet-700', bar: 'from-violet-300 to-violet-600' },
};

const formatPosted = (item) => `${item.author?.name || 'Admin'} • ${new Date(item.createdAt).toLocaleString()}`;

function AnnouncementItem({ item, highlight }) {
  const badge = BADGE[item.category] || BADGE.General;
  return (
    <article className={`eco-card eco-card-hover relative overflow-hidden py-5 pl-6 pr-5 ${highlight ? 'bg-gradient-to-r from-eco-50/70 to-white' : ''}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${badge.bar}`} />
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-extrabold text-gray-800 [overflow-wrap:anywhere]">{item.title}</h3>
        <span className={badge.className}>{badge.label}</span>
      </div>
      <p className="mt-0.5 text-xs font-medium text-gray-400">
        {formatPosted(item)}
        {item.editedAt && (
          <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-500" title={new Date(item.editedAt).toLocaleString()}>
            Edited · {new Date(item.editedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </p>
      <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
        {item.description || item.message}
      </p>
    </article>
  );
}

export default function AnnouncementsFeed({ storageKey, audience }) {
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const info = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const response = await fetch(`${API_BASE_URL}/api/announcements`, {
          headers: { Authorization: `Bearer ${info.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load announcements');
        // The server already filters; this is just a safety net.
        setAnnouncements((Array.isArray(data) ? data : []).filter((a) => ['General', audience].includes(a.category || 'General')));
      } catch (requestError) {
        setError(requestError.message === 'Failed to fetch' ? "Can't reach the server. Please try again." : requestError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storageKey, audience]);

  const mineCount = announcements.filter((a) => a.category === audience).length;
  const generalCount = announcements.length - mineCount;
  const visible = announcements.filter((a) => (
    filter === 'all' || (filter === 'mine' ? a.category === audience : (a.category || 'General') === 'General')
  ));
  const latest = visible.slice(0, 3);
  const earlier = visible.slice(3);

  if (loading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="eco-card h-28 animate-pulse bg-white/70" />)}</div>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: announcements.length },
          { key: 'mine', label: audience === 'Organizer' ? 'For organizers' : 'For volunteers', count: mineCount },
          { key: 'general', label: 'General', count: generalCount },
        ].map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setFilter(chip.key)}
            className={`eco-chip ${filter === chip.key ? 'eco-chip-active' : ''}`}
          >
            {chip.label}
            <span className="eco-chip-count">{chip.count}</span>
          </button>
        ))}
      </div>

      {error && <div className="eco-empty mb-4 border-red-200 bg-red-50 text-red-700">{error}</div>}

      {latest.length > 0 && (
        <section>
          <p className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-eco-700">
            <span className="h-2 w-2 rounded-full bg-eco-500 shadow-[0_0_0_4px_rgba(102,187,106,0.25)]" />
            Latest
          </p>
          <div className="space-y-3">
            {latest.map((item) => <AnnouncementItem key={item._id} item={item} highlight />)}
          </div>
        </section>
      )}

      {earlier.length > 0 && (
        <section className="mt-8">
          <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-gray-500">Earlier</p>
          <div className="space-y-3">
            {earlier.map((item) => <AnnouncementItem key={item._id} item={item} />)}
          </div>
        </section>
      )}

      {!error && visible.length === 0 && (
        <div className="eco-empty py-12">
          <Megaphone className="h-6 w-6 text-eco-400" />
          {announcements.length === 0 ? 'No announcements yet.' : 'No announcements in this list.'}
        </div>
      )}
    </div>
  );
}
