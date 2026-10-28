import { Bell, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NOTIFICATION_STYLES, POLL_MS, formatNotificationTime, notificationRequest,
} from './notificationApi';

/* =========================================================
   NOTIFICATION BELL  (admin + organizer dashboards)
   Reads the logged-in user's notifications from the server, so
   unread counts survive refreshes and other devices.

   Props:
     storageKey - localStorage key that holds the login info
                  ("adminInfo" or "organizerInfo")
========================================================= */

const readToken = (storageKey) => {
  try { return JSON.parse(localStorage.getItem(storageKey) || '{}').token || ''; } catch { return ''; }
};


export default function NotificationBell({ storageKey, onOpen }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const wrapperRef = useRef(null);

  const load = useCallback(async () => {
    const token = readToken(storageKey);
    if (!token) return;
    try {
      const data = await notificationRequest(token);
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* keep what we have; try again next poll */ }
  }, [storageKey]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) { setConfirmClear(false); return undefined; }
    const onClick = (e) => { if (!wrapperRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markRead = async (item) => {
    if (item.read) return;
    setItems((list) => list.map((n) => (n._id === item._id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationRequest(readToken(storageKey), `/${item._id}/read`, 'PATCH'); } catch { load(); }
  };

  // Click = mark read, close the list, and take the user to the related page.
  const handleItemClick = (item) => {
    markRead(item);
    setOpen(false);
    if (onOpen) onOpen(item);
  };

  const markAllRead = async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await notificationRequest(readToken(storageKey), '/read-all', 'PATCH'); } catch { load(); }
  };

  // Delete one notification.
  const removeOne = async (item) => {
    setItems((list) => list.filter((n) => n._id !== item._id));
    if (!item.read) setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationRequest(readToken(storageKey), `/${item._id}`, 'DELETE'); } catch { load(); }
  };

  // Delete every notification (asks first).
  const clearAll = async () => {
    setConfirmClear(false);
    setItems([]);
    setUnreadCount(0);
    try { await notificationRequest(readToken(storageKey), '', 'DELETE'); } catch { load(); }
  };

  return (
    <div ref={wrapperRef} className="relative flex items-center">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        className="eco-icon-btn"
      >
        <Bell className="h-[17px] w-[17px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-eco-600 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="eco-popover fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto p-4 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:max-h-none sm:w-[min(22rem,calc(100vw-2rem))] sm:overflow-visible text-slate-800">
          <div className="mb-3 flex items-center justify-between border-b border-eco-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="eco-icon-tile-soft h-8 w-8 rounded-lg">
                <Bell className="h-[15px] w-[15px]" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">Notifications</p>
                <p className="text-[11px] font-medium text-slate-500">{unreadCount} unread</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-eco-700 transition hover:bg-eco-50"
                >
                  Mark all read
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          </div>

          {confirmClear && (
            <div role="alertdialog" aria-label="Clear all notifications" className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs">
              <p className="font-semibold text-rose-800">Delete all {items.length} notifications?</p>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg px-2.5 py-1 font-semibold text-slate-600 hover:bg-white">Cancel</button>
                <button type="button" onClick={clearAll} className="rounded-lg bg-rose-600 px-2.5 py-1 font-bold text-white hover:bg-rose-700">Delete all</button>
              </div>
            </div>
          )}

          <div className="eco-scroll max-h-72 space-y-2 overflow-y-auto pr-1">
            {items.length > 0 ? items.map((item) => {
              const style = NOTIFICATION_STYLES[item.type] || NOTIFICATION_STYLES.announcement;
              const { Icon } = style;
              return (
                <div key={item._id} className="group relative">
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`flex w-full gap-3 rounded-xl border p-3 pr-9 text-left text-xs transition hover:border-eco-300 ${
                      item.read ? 'border-slate-100 bg-white' : 'border-eco-200 bg-eco-50/60'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800">{item.title}</span>
                        {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-eco-500" />}
                      </span>
                      <span className="mt-0.5 block leading-snug text-slate-600 [overflow-wrap:anywhere]">{item.message}</span>
                      <span className="mt-1 block text-[10px] font-medium text-slate-400">{formatNotificationTime(item.createdAt)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOne(item)}
                    aria-label={`Delete notification: ${item.title}`}
                    title="Delete"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }) : (
              <div className="eco-empty py-8">
                <Bell className="h-5 w-5 text-eco-400" />
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
