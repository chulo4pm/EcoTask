// Time helpers for activities. An activity happens on one calendar day, between a start
// time ("9:00 AM") and an end time ("5:00 PM"). The server runs in UTC, so "now" is
// always read in the timezone where EcoTask is used.
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Manila';
const TIME_PATTERN = /^(1[0-2]|[1-9]):00 (AM|PM)$/;

// "9:00 AM" -> 540 (minutes after midnight). Returns null when empty or not a time.
const parseTimeLabel = (label) => {
  const match = String(label || '').match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2] || 0);
};

// Activity dates are saved as midnight UTC of the chosen day, so the ISO date is the calendar day.
const activityDayKey = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);

// The current day ("2026-10-19") and minutes after midnight in the app's timezone.
const getNow = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

// 'upcoming' (a later day), 'ongoing' (the day of the event, until its end time),
// 'completed' (after the end time). Older activities without an end time stay
// 'ongoing' until the day is over.
const getActivityPhase = (activity, now = getNow()) => {
  const day = activityDayKey(activity.date);
  if (day > now.dayKey) return 'upcoming';
  if (day < now.dayKey) return 'completed';
  const end = parseTimeLabel(activity.endTime);
  if (end !== null && now.minutes >= end) return 'completed';
  return 'ongoing';
};

// True once the start time has passed (or the day is over). Volunteers can't leave after this.
const hasActivityStarted = (activity, now = getNow()) => {
  const day = activityDayKey(activity.date);
  if (day > now.dayKey) return false;
  if (day < now.dayKey) return true;
  const start = parseTimeLabel(activity.time);
  return start === null || now.minutes >= start;
};

const hasActivityEnded = (activity, now = getNow()) => getActivityPhase(activity, now) === 'completed';

module.exports = {
  APP_TIMEZONE,
  TIME_PATTERN,
  parseTimeLabel,
  activityDayKey,
  getNow,
  getActivityPhase,
  hasActivityStarted,
  hasActivityEnded,
};
