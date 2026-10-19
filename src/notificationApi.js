import {
  Ban, CalendarClock, CheckCircle2, ClipboardCheck, Flag, Leaf, Megaphone, UserPlus, XCircle,
} from 'lucide-react';
import { API_BASE_URL } from './config';

// Shared by the notification bell (admin/organizer) and the volunteer dashboard.

const API_URL = `${API_BASE_URL}/api/notifications`;
export const POLL_MS = 30000;

export const NOTIFICATION_STYLES = {
  announcement:          { Icon: Megaphone,     tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  activity_published:    { Icon: Leaf,          tone: 'border-eco-200 bg-eco-50 text-eco-700' },
  activity_updated:      { Icon: CalendarClock, tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  activity_cancelled:    { Icon: Ban,           tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  attendance_marked:     { Icon: ClipboardCheck, tone: 'border-eco-200 bg-eco-50 text-eco-700' },
  organizer_approved:    { Icon: CheckCircle2,  tone: 'border-eco-200 bg-eco-50 text-eco-700' },
  organizer_rejected:    { Icon: XCircle,       tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  volunteer_joined:      { Icon: UserPlus,      tone: 'border-eco-200 bg-eco-50 text-eco-700' },
  organizer_application: { Icon: ClipboardCheck, tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  report_reviewed:       { Icon: CheckCircle2,  tone: 'border-eco-200 bg-eco-50 text-eco-700' },
  activity_hidden:       { Icon: Ban,           tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  activity_unhidden:     { Icon: CheckCircle2,  tone: 'border-eco-200 bg-eco-50 text-eco-700' },
  activity_reported:     { Icon: Flag,          tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  report_submitted:      { Icon: Flag,          tone: 'border-rose-200 bg-rose-50 text-rose-700' },
};

export const formatNotificationTime = (value) => {
  const time = new Date(value).getTime();
  if (!time) return 'Recently';
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Small fetch helper shared with the volunteer dashboard.
export const notificationRequest = async (token, path = '', method = 'GET') => {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

