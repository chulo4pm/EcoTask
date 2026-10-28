// Shared time rules for activities (mirrors the backend's utils/activityTime.js).
// An activity happens on one calendar day, from a start time to an end time.
import { useEffect, useState } from 'react';

// "9:00 AM" -> 540 (minutes after midnight), or null when empty / not a time.
export const parseTimeLabel = (label) => {
  const match = String(label || '').match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2] || 0);
};

const dayKeyOf = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const nowParts = () => {
  const now = new Date();
  return { dayKey: dayKeyOf(now), minutes: now.getHours() * 60 + now.getMinutes() };
};

// Works with the raw API activity, or the page-specific copies that keep `rawDate`/`startTime`.
export const getStartLabel = (activity) => (
  activity?.startTime || activity?.time || activity?.tasks?.[0] || ''
);
const getDay = (activity) => dayKeyOf(activity?.rawDate || activity?.date);

// 'Upcoming' (a later day), 'Ongoing' (the day of the event until its end time), 'Completed'.
// Activities saved before end times existed stay 'Ongoing' until the day is over.
export const getActivityStatus = (activity, now = nowParts()) => {
  const day = getDay(activity);
  if (day > now.dayKey) return 'Upcoming';
  if (day < now.dayKey) return 'Completed';
  const end = parseTimeLabel(activity?.endTime);
  if (end !== null && now.minutes >= end) return 'Completed';
  return 'Ongoing';
};

// True once the start time has passed. Volunteers can't cancel their registration after this.
export const hasActivityStarted = (activity, now = nowParts()) => {
  const day = getDay(activity);
  if (day > now.dayKey) return false;
  if (day < now.dayKey) return true;
  const start = parseTimeLabel(getStartLabel(activity));
  return start === null || now.minutes >= start;
};

export const hasActivityEnded = (activity, now = nowParts()) => getActivityStatus(activity, now) === 'Completed';

// "9:00 AM – 5:00 PM", or just the start time for older activities.
export const formatTimeRange = (activity) => {
  const start = getStartLabel(activity);
  const end = activity?.endTime || '';
  if (start && end) return `${start} – ${end}`;
  return start || 'Time not specified';
};

// Keeps stored statuses in step with the clock (an activity turns Completed when its end time passes).
export function useStatusRefresh(setList, intervalMs = 30000) {
  useEffect(() => {
    const id = setInterval(() => {
      setList((current) => {
        const now = nowParts();
        const changed = current.some((a) => a.status && getActivityStatus(a, now) !== a.status);
        return changed ? current.map((a) => (a.status ? { ...a, status: getActivityStatus(a, now) } : a)) : current;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [setList, intervalMs]);
}

// Re-renders the component on a timer, so statuses worked out while rendering stay current.
export function useClockTick(intervalMs = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
