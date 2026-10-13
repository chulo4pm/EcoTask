import volunteerImage from './assets/voluteer.jpg'
import { jsPDF } from 'jspdf'

const getActivityImageUrl = (image) => (
  image?.startsWith('/uploads/') ? `${API_BASE_URL}${image}` : image
)

const getDateKey = (dateValue) => {
  if (!dateValue) return ''
  if (typeof dateValue === 'string') return dateValue.slice(0, 10)
  const date = new Date(dateValue)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getActivityStatus = (dateValue) => {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const activityKey = getDateKey(dateValue)
  if (activityKey < todayKey) return 'Completed'
  if (activityKey === todayKey) return 'Ongoing'
  return 'Upcoming'
}

const isTomorrow = (dateValue) => {
  const activityDate = new Date(dateValue)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return activityDate.getFullYear() === tomorrow.getFullYear() &&
    activityDate.getMonth() === tomorrow.getMonth() &&
    activityDate.getDate() === tomorrow.getDate()
}

const activityTimeInMinutes = (activity) => {
  const time = activity.time || activity.tasks?.[0] || ''
  const match = String(time).match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
  if (!match) return 0
  let hour = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') hour += 12
  return hour * 60 + Number(match[2] || 0)
}
const activityMoment = (activity) => (
  new Date(activity.rawDate || activity.date).getTime() + activityTimeInMinutes(activity) * 60000
)
// Active list: today first, then the soonest. Past list: the most recent first.
const sortSoonestFirst = (list) => [...list].sort((a, b) => activityMoment(a) - activityMoment(b))
const sortLatestFirst = (list) => [...list].sort((a, b) => activityMoment(b) - activityMoment(a))

const sortActivitiesByStatus = (activities) => {
  const getTimeInMinutes = (activity) => {
    const time = activity.time || activity.tasks?.[0] || ''
    const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
    if (!match) return 0
    let hour = Number(match[1]) % 12
    if (match[3].toUpperCase() === 'PM') hour += 12
    return hour * 60 + Number(match[2] || 0)
  }

  return [...activities].sort((a, b) => (
    ({ Upcoming: 0, Ongoing: 1, Completed: 2 }[a.status] - ({ Upcoming: 0, Ongoing: 1, Completed: 2 }[b.status])) ||
    (new Date(a.rawDate || a.date) - new Date(b.rawDate || b.date)) ||
    (getTimeInMinutes(a) - getTimeInMinutes(b))
  ))
}
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  Ban,
  RefreshCw,
  Bell,
  LayoutDashboard,
  Calendar,
  Award,
  User,
  Settings,
  LogOut,
  ChevronDown,
  TreePine,
  Leaf,
  Megaphone,
  Clock,
  MapPin,
  Landmark,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Menu,
  X,
  Users,
  ChevronRight,
  Sparkles,
  Inbox,
  Download,
  XCircle,
  Flag,
  Building2,
  Lock,
} from 'lucide-react'
import { NOTIFICATION_STYLES, formatNotificationTime, notificationRequest } from './notificationApi'
import { API_BASE_URL } from "./config";

/* =========================================================
   ECOTASK LOGO
========================================================= */

function EcoTaskLogo({ light = false }) {
  return (
    <div className={`flex items-center font-black tracking-tight ${light ? 'text-white' : 'text-eco-700'}`}>
      <span className="text-[26px]">Ec</span>
      <span className="mx-[2px] inline-flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="42" stroke="#66BB6A" strokeWidth="12" fill="#1B5E20" />
          <rect x="45" y="52" width="10" height="22" rx="3" fill="#66BB6A" />
          <path d="M50 18 L30 48 H70 Z" fill="#66BB6A" />
          <path d="M50 30 L36 54 H64 Z" fill="#A5D6A7" />
        </svg>
      </span>
      <span className="text-[26px]">Task</span>
    </div>
  )
}

/* =========================================================
   APP
========================================================= */

// "Activity tomorrow" reminders are made in the browser, so their read/cleared
// state is remembered here (per volunteer). Everything else lives on the server.
const reminderKey = (userId) => `ecotaskReminderState:${userId || 'guest'}`
const loadReminderState = (userId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(reminderKey(userId)) || '{}')
    return { read: saved.read || [], cleared: saved.cleared || [] }
  } catch {
    return { read: [], cleared: [] }
  }
}
const rememberReminders = (userId, field, ids) => {
  if (!ids.length) return
  try {
    const state = loadReminderState(userId)
    state[field] = [...new Set([...state[field], ...ids])].slice(-300)
    localStorage.setItem(reminderKey(userId), JSON.stringify(state))
  } catch { /* storage blocked: the reminder just shows as new again */ }
}

/* =========================================================
   SUSPENDED SCREEN (same as the organizer's)
   The admin suspended this volunteer: show the reason instead
   of the dashboard. "Check again" re-asks the server.
========================================================= */

function VolunteerSuspendedScreen({ name, reason, checking, onRefresh, onLogout }) {
  return (
    <div className="eco-app-bg flex min-h-screen items-center justify-center p-4">
      <div className="eco-card w-full max-w-lg overflow-hidden text-slate-800">
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <Ban className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold">Account suspended</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The admin has suspended {name ? <span className="font-bold">{name}</span> : 'your account'}.
            You can't join activities or use EcoTask until it's reactivated.
          </p>
          {reason && (
            <div className="mt-4 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-800">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Reason</p>
              <p className="mt-1 [overflow-wrap:anywhere]">{reason}</p>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">If you think this is a mistake, please contact the EcoTask admin.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-eco-100 bg-eco-50/40 px-6 py-4">
          <button type="button" onClick={onRefresh} disabled={checking} className="eco-btn eco-btn-secondary">
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> Check again
          </button>
          <button type="button" onClick={onLogout} className="eco-btn eco-btn-primary">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App({ onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch {
      return {}
    }
  })

  // Set when the admin has suspended this account: { reason }
  const [suspension, setSuspension] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  const checkAccountStatus = async () => {
    if (!currentUser.token) return
    setCheckingStatus(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 403 && data.suspended) {
        setSuspension({ reason: data.suspendedReason || '' })
      } else if (response.ok) {
        setSuspension(null)
      }
    } catch {
      // Offline: keep showing whatever we showed before.
    } finally {
      setCheckingStatus(false)
    }
  }

  // Check on load, then every minute, so a suspension takes effect without a refresh.
  useEffect(() => {
    checkAccountStatus()
    const timer = window.setInterval(checkAccountStatus, 60000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.token])

  const displayName = currentUser.name || 'Volunteer'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const [notifications, setNotifications] = useState([])
  const [notifTab, setNotifTab] = useState('ALL')
  // Changes made here that the next poll might not reflect yet (request still in flight).
  const readLocally = useRef(new Set())
  const clearedAt = useRef(0)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (!currentUser.token) return
        const headers = { Authorization: `Bearer ${currentUser.token}` }
        const [activityResponse, serverData] = await Promise.all([
          fetch(`${API_BASE_URL}/api/activities`, { headers }),
          notificationRequest(currentUser.token).catch(() => null),
        ])
        const activities = activityResponse.ok ? await activityResponse.json() : []

        // Saved on the server: new activities, announcements, activity changes/cancellations, attendance.
        const SERVER_TYPES = {
          activity_published: { type: 'ACTIVITY', actionText: 'View activity' },
          announcement: { type: 'ANNOUNCEMENT', actionText: 'View announcement' },
          activity_updated: { type: 'SCHEDULE', actionText: 'View schedule' },
          activity_cancelled: { type: 'SCHEDULE', actionText: 'View schedule' },
          attendance_marked: { type: 'RECORD', actionText: 'View record' },
        }
        const serverNotifications = (serverData?.notifications || [])
          .filter((item) => new Date(item.createdAt).getTime() > clearedAt.current)
          .map((item) => {
            const meta = SERVER_TYPES[item.type] || { type: 'SCHEDULE', actionText: 'View' }
            const { Icon } = NOTIFICATION_STYLES[item.type] || NOTIFICATION_STYLES.announcement
            return {
              id: `server-${item._id}`,
              serverId: item._id,
              type: meta.type,
              icon: <Icon size={14} className="text-eco-700" />,
              title: item.title,
              message: item.message,
              isNew: !item.read && !readLocally.current.has(item._id),
              timestamp: new Date(item.createdAt).getTime(),
              time: formatNotificationTime(item.createdAt),
              actionText: meta.actionText,
            }
          })

        const reminderState = loadReminderState(currentUser._id)
        const tomorrowActivityNotifications = (Array.isArray(activities) ? activities : [])
          .filter((activity) => isTomorrow(activity.date))
          .map((activity) => {
            const joined = (activity.participants || []).some((participant) => (
              (participant._id || participant).toString() === currentUser._id
            ))
            const id = `activity-tomorrow-${activity._id}-${currentUser._id}`
            return {
              id,
              reminder: true,
              type: 'ACTIVITY',
              icon: <Calendar size={14} className="text-eco-700" />,
              title: joined ? 'Activity reminder' : 'Activity tomorrow',
              message: joined
                ? `${activity.title} is tomorrow. We look forward to seeing you!`
                : `${activity.title} is tomorrow. Would you like to join?`,
              isNew: !reminderState.read.includes(id),
              timestamp: new Date(activity.date).getTime(),
              time: 'Tomorrow',
              actionText: joined ? 'View activity' : 'Join activity',
            }
          })
          .filter((item) => !reminderState.cleared.includes(item.id))

        // Server unreachable: keep what is already shown instead of wiping the list.
        if (!serverData) {
          setNotifications((current) => {
            const reminders = new Map(tomorrowActivityNotifications.map((n) => [n.id, n]))
            return [...current.filter((n) => !n.reminder), ...reminders.values()]
              .sort((x, y) => (y.timestamp || 0) - (x.timestamp || 0))
          })
          return
        }

        setNotifications(
          [...serverNotifications, ...tomorrowActivityNotifications]
            .sort((x, y) => (y.timestamp || 0) - (x.timestamp || 0))
        )
      } catch (error) {
        console.error(error)
      }
    }

    loadNotifications()
    const refreshInterval = window.setInterval(loadNotifications, 15000)
    return () => window.clearInterval(refreshInterval)
  }, [currentUser.token, currentUser._id])

  const goTo = (page) => {
    setActivePage(page)
    setProfileOpen(false)
    setNotificationOpen(false)
    setMobileNavOpen(false)
  }

  // Clicking a notification marks it read (count goes down) and opens the related page.
  const handleViewNotificationDetails = (notif) => {
    setNotificationOpen(false)
    if (notif.isNew) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isNew: false } : n)))
      if (notif.serverId) {
        readLocally.current.add(notif.serverId)
        notificationRequest(currentUser.token, `/${notif.serverId}/read`, 'PATCH').catch(() => {})
      } else if (notif.reminder) {
        rememberReminders(currentUser._id, 'read', [notif.id])
      }
    }
    if (notif.type === 'ANNOUNCEMENT') {
      setActivePage('announcement')
    } else if (notif.type === 'ACTIVITY') {
      setActivePage('activities')
    } else if (notif.type === 'RECORD') {
      setActivePage('records')
    } else {
      setActivePage('schedule')
    }
  }

  const handleMarkAllRead = () => {
    notifications.forEach((n) => { if (n.serverId) readLocally.current.add(n.serverId) })
    rememberReminders(currentUser._id, 'read', notifications.filter((n) => n.reminder).map((n) => n.id))
    setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })))
    notificationRequest(currentUser.token, '/read-all', 'PATCH').catch(() => {})
  }

  const handleClearAll = () => {
    clearedAt.current = Date.now()
    rememberReminders(currentUser._id, 'cleared', notifications.filter((n) => n.reminder).map((n) => n.id))
    setNotifications([])
    notificationRequest(currentUser.token, '', 'DELETE').catch(() => {})
  }

  const filteredNotifications = notifications
    .filter((n) => notifTab !== 'RECENT' || n.isNew)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'activities', label: 'Activities', icon: Leaf },
    { key: 'schedule', label: 'My Schedule', icon: Calendar },
    { key: 'records', label: 'Participation Record', icon: Award },
    { key: 'announcement', label: 'Announcement', icon: Megaphone },
  ]
  const pageTitles = {
    dashboard: 'Dashboard',
    activities: 'Activities',
    schedule: 'My Schedule',
    records: 'Participation Record',
    announcement: 'Announcement',
    settings: 'Settings',
  }
  const newCount = notifications.filter((n) => n.isNew).length
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  const sidebarContent = (
    <div className="flex h-full flex-col px-3.5 py-5">
      {/* ECOTASK LOGO */}
      <div className="flex items-center justify-center border-b border-white/10 pb-5">
        <EcoTaskLogo light />
      </div>

      {/* NAVIGATION */}
      <p className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-eco-200/60">
        Menu
      </p>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ key, label, icon: Icon }) => (
          <SidebarItem
            key={key}
            active={activePage === key}
            icon={<Icon size={18} />}
            onClick={() => goTo(key)}
          >
            {label}
          </SidebarItem>
        ))}
      </nav>
    </div>
  )

  if (suspension) {
    return (
      <VolunteerSuspendedScreen
        name={currentUser.name}
        reason={suspension.reason}
        checking={checkingStatus}
        onRefresh={checkAccountStatus}
        onLogout={() => {
          if (onLogout) onLogout()
          else {
            localStorage.removeItem('userInfo')
            window.location.href = '/'
          }
        }}
      />
    )
  }

  return (
    <div className="eco-app-bg flex h-screen w-screen overflow-hidden font-sans text-eco-950 antialiased">
      {/* ================= SIDEBAR (desktop) ================= */}
      <aside className="eco-sidebar z-40 hidden w-[260px] shrink-0 flex-col text-white lg:flex">
        {sidebarContent}
      </aside>

      {/* ================= SIDEBAR (mobile drawer) ================= */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="ecotask-modal-backdrop eco-modal-backdrop absolute inset-0"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="eco-sidebar ecotask-drawer absolute inset-y-0 left-0 flex w-[270px] flex-col text-white">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-eco-100 hover:bg-white/10"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* HEADER */}
        <header className="eco-header z-30 flex shrink-0 items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="eco-icon-btn lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-eco-600/80 sm:block">
                {todayLabel}
              </p>
              <h2 className="truncate text-lg font-extrabold text-eco-800">
                {pageTitles[activePage]}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* NOTIFICATION DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen)
                  setProfileOpen(false)
                }}
                aria-label="Notifications"
                className="eco-icon-btn"
              >
                <Bell size={17} />
                {newCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-eco-600 px-1 text-[10px] font-black text-white ring-2 ring-white">
                    {newCount > 9 ? '9+' : newCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="eco-popover fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto p-4 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:max-h-none sm:w-[min(24rem,calc(100vw-2rem))] sm:overflow-visible text-eco-950">
                  <div className="mb-3 flex items-center justify-between border-b border-eco-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="eco-icon-tile-soft h-8 w-8 rounded-lg">
                        <Bell size={15} />
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900">Notifications</h3>
                        <p className="text-[11px] font-medium text-gray-500">{newCount} new</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleMarkAllRead}
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-eco-700 transition hover:bg-eco-50"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-1.5">
                    {['ALL', 'RECENT'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setNotifTab(tab)}
                        className={`eco-chip px-3.5 py-1 ${notifTab === tab ? 'eco-chip-active' : ''}`}
                      >
                        {tab === 'ALL' ? 'All' : 'Unread'}
                      </button>
                    ))}
                  </div>

                  <div className="eco-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notif) => (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => handleViewNotificationDetails(notif)}
                          className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:border-eco-300 hover:bg-eco-50/70 ${
                            notif.isNew ? 'border-eco-200 bg-eco-50/50' : 'border-gray-100 bg-white'
                          }`}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-eco-100 bg-white">
                            {notif.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-gray-900">{notif.title}</span>
                              {notif.isNew && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-eco-500" />}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-600 [overflow-wrap:anywhere]">{notif.message}</span>
                            <span className="mt-1.5 flex items-center justify-between">
                              <span className="text-[10px] font-medium text-gray-400">{notif.time}</span>
                              <span className="flex items-center gap-0.5 text-[11px] font-bold text-eco-700 opacity-80 group-hover:opacity-100">
                                {notif.actionText}
                                <ChevronRight size={12} />
                              </span>
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="eco-empty py-8">
                        <Inbox size={22} className="text-eco-400" />
                        You're all caught up.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotificationOpen(false)
                }}
                className="flex h-10 items-center gap-2 rounded-full border border-eco-200/70 bg-white pl-1.5 pr-3 shadow-sm transition hover:bg-eco-50"
              >
                <div className="eco-avatar h-7 w-7 text-[10px]">{initials}</div>
                <span className="hidden text-xs font-bold text-eco-950 md:block">
                  {displayName}
                </span>
                <ChevronDown size={14} className={`text-eco-700 transition ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="eco-popover absolute right-0 top-12 z-50 w-56 p-2 text-eco-950">
                  <div className="mb-1 flex items-center gap-3 rounded-xl bg-eco-50/70 px-3 py-2.5">
                    <div className="eco-avatar h-9 w-9 text-xs">{initials}</div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">{displayName}</p>
                      <p className="text-[11px] font-medium text-eco-700">Volunteer</p>
                    </div>
                  </div>

                  <button
                    onClick={() => goTo('settings')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition hover:bg-eco-50"
                  >
                    <Settings size={15} className="text-eco-700" />
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      // The app's logout removes the saved login (and says goodbye by name).
                      if (onLogout) onLogout()
                      else {
                        localStorage.removeItem('userInfo')
                        window.location.href = '/'
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= SCROLLABLE CONTENT ================= */}
        <main key={activePage} className="ecotask-page-scroll ecotask-page-enter eco-scroll flex-1 overflow-y-auto">
          {activePage === 'dashboard' && <Dashboard goTo={goTo} displayName={displayName} />}
          {activePage === 'activities' && <Activities goTo={goTo} />}
          {activePage === 'schedule' && (
            <Schedule
              goTo={goTo}
            />
          )}
          {activePage === 'records' && <Records goTo={goTo} />}
          {activePage === 'announcement' && <Announcement goTo={goTo} />}
          {activePage === 'settings' && (
            <SettingsPage onProfileUpdated={(updatedUser) => setCurrentUser((user) => ({ ...user, ...updatedUser }))} />
          )}
        </main>
      </div>
    </div>
  )
}

/* =========================================================
   SIDEBAR ITEM
========================================================= */

function SidebarItem({ active, icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`eco-nav-item ${active ? 'eco-nav-item-active' : ''}`}
    >
      <span className="eco-nav-item-icon">{icon}</span>
      <span>{children}</span>
    </button>
  )
}

/* =========================================================
   PAGE HEADER (shared)
========================================================= */

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="eco-page-title">{title}</h1>
        {subtitle && <p className="eco-page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ goTo, displayName }) {
  const [stats, setStats] = useState({
    activitiesJoined: 0,
    completedActivities: 0,
    totalHours: 0,
    certificatesEarned: 0,
  })
  const [activities, setActivities] = useState([])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const response = await fetch(`${API_BASE_URL}/api/dashboard/volunteer-stats`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load dashboard statistics')
        setStats(data)
      } catch (error) {
        console.error(error)
      }
    }

    loadStats()
  }, [])

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const response = await fetch(`${API_BASE_URL}/api/activities`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        const data = await response.json()
        if (!response.ok) return
        setActivities(sortActivitiesByStatus(data.map((activity) => ({
          ...activity,
          joined: (activity.participants || []).some((participant) => (
            (participant._id || participant).toString() === userInfo._id
          )),
          status: getActivityStatus(activity.date),
        }))))
      } catch (error) {
        console.error(error)
      }
    }

    loadActivities()
  }, [])

  const joinedActivities = activities.filter((activity) => activity.joined)
  const upcomingJoinedActivities = joinedActivities
    .filter((activity) => activity.status !== 'Completed')
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = displayName.split(' ')[0]

  return (
    <div className="mx-auto max-w-[1450px] p-5 lg:p-8">
      {/* WELCOME BANNER */}
      <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-eco-700 via-eco-600 to-eco-500 p-6 text-white shadow-[0_20px_40px_-18px_rgba(27,94,32,0.7)] md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-eco-200/20 blur-2xl" />
        <TreePine className="pointer-events-none absolute -bottom-6 right-6 h-40 w-40 text-white/10" strokeWidth={1.2} />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-eco-100">
            <Sparkles size={14} /> {greeting}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            Hello, {firstName}!
          </h1>
          <p className="mt-2 max-w-xl text-sm text-eco-50/90">
            {upcomingJoinedActivities.length > 0
              ? `You have ${upcomingJoinedActivities.length} upcoming activit${upcomingJoinedActivities.length === 1 ? 'y' : 'ies'}. Thanks for helping keep our community green.`
              : 'Find an activity you care about and join fellow volunteers making a difference.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goTo('activities')}
              className="eco-btn bg-white text-eco-700 shadow-md hover:bg-eco-50"
            >
              <Leaf size={15} /> Browse activities
            </button>
            <button
              type="button"
              onClick={() => goTo('schedule')}
              className="eco-btn border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Calendar size={15} /> My schedule
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Activities Joined" value={stats.activitiesJoined} icon={<Leaf size={18} />} />
            <StatCard title="Activities Completed" value={stats.completedActivities} icon={<CheckCircle size={18} />} />
            <StatCard title="Certificates Earned" value={stats.certificatesEarned} icon={<Award size={18} />} />
          </div>

          <section className="eco-card overflow-hidden">
            <div className="eco-card-header">
              <h3 className="eco-section-title">
                <span className="eco-icon-tile h-8 w-8 rounded-lg"><Leaf size={15} /></span>
                Discover Activities
              </h3>
              <button
                type="button"
                onClick={() => goTo('activities')}
                className="flex items-center gap-0.5 text-xs font-bold text-eco-700 hover:text-eco-800"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-2.5 p-4">
              {activities.filter((activity) => activity.status !== 'Completed').slice(0, 4).map((activity) => (
                <ActivityRow
                  key={activity._id}
                  title={activity.title}
                  meta={`${new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${activity.location || 'Location TBA'}`}
                  status={activity.status}
                  joined={activity.joined}
                  onClick={() => goTo('activities')}
                />
              ))}
              {activities.filter((activity) => activity.status !== 'Completed').length === 0 && (
                <div className="eco-empty">
                  <Leaf size={22} className="text-eco-400" />
                  No open activities right now. Check back soon!
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <section className="eco-card h-fit overflow-hidden">
          <div className="eco-card-header">
            <h3 className="eco-section-title">
              <span className="eco-icon-tile h-8 w-8 rounded-lg"><Calendar size={15} /></span>
              My Upcoming Schedule
            </h3>
          </div>

          <div className="space-y-2.5 p-4">
            {upcomingJoinedActivities.slice(0, 4).map((activity) => (
              <ScheduleRow
                key={activity._id}
                date={activity.date}
                title={activity.title}
                time={activity.time || activity.tasks?.[0] || 'Time not specified'}
                location={activity.location}
              />
            ))}
            {upcomingJoinedActivities.length === 0 && (
              <div className="eco-empty">
                <Calendar size={22} className="text-eco-400" />
                No joined activities scheduled.
                <button type="button" onClick={() => goTo('activities')} className="eco-btn eco-btn-primary eco-btn-sm mt-1">
                  Find an activity
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ title, value, icon }) {
  return (
    <div className="eco-stat">
      <div className="flex items-start justify-between gap-3">
        <p className="eco-stat-label">{title}</p>
        {icon && <span className="eco-icon-tile h-9 w-9 rounded-xl">{icon}</span>}
      </div>
      <p className="eco-stat-value">{value ?? 0}</p>
    </div>
  )
}

/* =========================================================
   ACTIVITY ROW
========================================================= */

function StatusBadge({ status }) {
  const tone = status === 'Completed' ? 'eco-badge-gray' : status === 'Ongoing' ? 'eco-badge-amber' : 'eco-badge-blue'
  return <span className={`eco-badge ${tone}`}>{status}</span>
}

function ActivityRow({ title, meta, status, joined, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-eco-100 bg-gradient-to-r from-eco-50/80 to-white px-4 py-3.5 text-left transition hover:border-eco-300 hover:shadow-md"
    >
      <span className="eco-icon-tile-soft"><Leaf size={17} /></span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-gray-800">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-gray-500">{meta}</span>}
      </span>

      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {joined && <span className="eco-badge eco-badge-green">Joined</span>}
        {status && <StatusBadge status={status} />}
      </span>

      <ChevronRight size={18} className="shrink-0 text-eco-400 transition group-hover:translate-x-0.5 group-hover:text-eco-700" />
    </button>
  )
}

/* =========================================================
   SCHEDULE ROW
========================================================= */

function ScheduleRow({ date, title, time, location }) {
  const day = new Date(date)
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-eco-100 bg-white p-2.5 pr-4 transition hover:border-eco-300 hover:shadow-sm">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-eco-600 to-eco-700 text-white shadow-md">
        <span className="text-[10px] font-bold uppercase tracking-wider text-eco-100">
          {day.toLocaleDateString(undefined, { month: 'short' })}
        </span>
        <span className="text-xl font-extrabold leading-none">{day.getDate()}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-800">{title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
          <Clock size={12} className="shrink-0 text-eco-600" /> {time}
        </p>
        {location && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
            <MapPin size={12} className="shrink-0 text-eco-600" /> {location}
          </p>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   ACTIVITIES
========================================================= */

function Activities({ goTo }) {
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [registrationActivity, setRegistrationActivity] = useState(null)
  const [cancelActivity, setCancelActivity] = useState(null)
  const [reportActivity, setReportActivity] = useState(null)
  const [reportedIds, setReportedIds] = useState([])
  const [pageNotice, setPageNotice] = useState('')
  const [registeredActivities, setRegisteredActivities] = useState([])
  const [activityFilter, setActivityFilter] = useState('All')
  // Two separate lists: what you can still join ("active") and finished ones ("past").
  const [view, setView] = useState('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const modalOpen = Boolean(selectedActivity || registrationActivity || cancelActivity || reportActivity)
    if (!modalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const pageScroller = document.querySelector('.ecotask-page-scroll')
    const previousScrollerOverflow = pageScroller?.style.overflow
    document.body.style.overflow = 'hidden'
    if (pageScroller) pageScroller.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (pageScroller) pageScroller.style.overflow = previousScrollerOverflow || ''
    }
  }, [selectedActivity, registrationActivity, cancelActivity, reportActivity])

  const fallbackActivities = [
    {
      id: 1,
      title: 'TREE PLANTING DRIVE',
      location: 'Mangatarem, Pangasinan',
      landmark: 'Mangatarem Town Plaza Gate 2',
      date: 'September 26, 2026',
      time: '8:00 AM - 12:00 PM',
      volunteers: '13/20 Volunteers Joined',
      image: volunteerImage,
      description:
        'Join our community tree planting activity and help restore green spaces in our community. This activity aims to promote environmental awareness and encourage everyone to take part in protecting nature.',
    },
    {
      id: 2,
      title: 'ELECTRONIC WASTE COLLECTION DAY',
      location: 'Mangatarem, Pangasinan',
      landmark: 'Municipal Covered Court',
      date: 'September 28, 2026',
      time: '9:00 AM - 3:00 PM',
      volunteers: '10/20 Volunteers Joined',
      image: volunteerImage,
      description:
        'Help collect and properly dispose of electronic waste. This activity promotes responsible waste management and keeps harmful materials away from our environment.',
    },
    {
      id: 3,
      title: 'COMMUNITY URBAN GARDENING',
      location: 'Mangatarem, Pangasinan',
      landmark: 'Barangay Hall Grounds',
      date: 'September 30, 2026',
      time: '7:30 AM - 11:30 AM',
      volunteers: '12/20 Volunteers Joined',
      image: volunteerImage,
      description:
        'Take part in creating and maintaining a community garden. Volunteers will help prepare planting areas, care for plants, and promote a greener community.',
    },
    {
      id: 4,
      title: 'COASTAL CLEANUP ACTION',
      location: 'Lingayen, Pangasinan',
      landmark: 'Lingayen Gulf Baywalk',
      date: 'October 5, 2026',
      time: '6:00 AM - 10:00 AM',
      volunteers: '15/25 Volunteers Joined',
      image: volunteerImage,
      description:
        'Join fellow volunteers in cleaning coastal areas and helping reduce plastic and other waste that can harm marine life.',
    },
    {
      id: 5,
      title: 'MOUNTAIN TRAIL CLEANUP',
      location: 'Baguio, Benguet',
      landmark: 'Camp John Hay Eco-Trail Entrance',
      date: 'October 10, 2026',
      time: '7:00 AM - 12:00 PM',
      volunteers: '8/15 Volunteers Joined',
      image: volunteerImage,
      description:
        'Help maintain a clean and safe mountain trail while promoting environmental responsibility among hikers and visitors.',
    },
    {
      id: 6,
      title: 'RECYCLING AWARENESS CAMPAIGN',
      location: 'Dagupan City, Pangasinan',
      landmark: 'Dagupan City Plaza',
      date: 'October 15, 2026',
      time: '1:00 PM - 5:00 PM',
      volunteers: '11/20 Volunteers Joined',
      image: volunteerImage,
      description:
        'Learn and share proper recycling practices with the community. Help encourage households to reduce waste and recycle more effectively.',
    },
  ]

  const [activities, setActivities] = useState(fallbackActivities)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const response = await fetch(`${API_BASE_URL}/api/activities`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load activities')

        const normalizedActivities = data.map((activity) => ({
          id: activity._id,
          title: activity.title,
          location: activity.location,
          landmark: activity.tasks?.[1] || 'Meeting place not specified',
          date: new Date(activity.date).toLocaleDateString(),
          time: activity.tasks?.[0] || 'Time not specified',
          volunteers: `${activity.participants?.length || 0}/${activity.volunteerLimit} Volunteers Joined`,
          participantCount: activity.participants?.length || 0,
          volunteerLimit: activity.volunteerLimit,
          image: getActivityImageUrl(activity.coverImage) || volunteerImage,
          description: activity.description,
          participantIds: (activity.participants || []).map((participant) => (
            (participant._id || participant).toString()
          )),
          status: getActivityStatus(activity.date),
          rawDate: activity.date,
          organizerName: activity.organizer?.organizationName || activity.organizer?.name || '',
        }))

        setActivities(sortActivitiesByStatus(normalizedActivities))
        fetch(`${API_BASE_URL}/api/reports/mine`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
          .then((reportResponse) => (reportResponse.ok ? reportResponse.json() : []))
          .then((ids) => setReportedIds(Array.isArray(ids) ? ids : []))
          .catch(() => {})

        setRegisteredActivities(
          normalizedActivities
            .filter((activity) => activity.participantIds.includes(userInfo._id))
            .map((activity) => activity.id)
        )
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadActivities()
  }, [])

  const updateActivityAfterResponse = (updatedActivity) => {
    setActivities((currentActivities) => currentActivities.map((activity) => (
      activity.id === updatedActivity._id
        ? {
            ...activity,
            volunteers: `${updatedActivity.participants?.length || 0}/${updatedActivity.volunteerLimit} Volunteers Joined`,
            participantCount: updatedActivity.participants?.length || 0,
            volunteerLimit: updatedActivity.volunteerLimit,
          }
        : activity
    )))
  }

  const joinActivity = async () => {
    if (!registrationActivity) return
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const response = await fetch(`${API_BASE_URL}/api/activities/${registrationActivity.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to join activity')
      updateActivityAfterResponse(data)
      setRegisteredActivities((current) => [...current, registrationActivity.id])
      setRegistrationActivity(null)
    } catch (requestError) {
      alert(requestError.message)
    }
  }

  const leaveActivity = async () => {
    if (!cancelActivity) return
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const response = await fetch(`${API_BASE_URL}/api/activities/${cancelActivity.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to leave activity')
      setActivities((currentActivities) => currentActivities.map((activity) => (
        activity.id === cancelActivity.id
          ? {
              ...activity,
              volunteers: `${Math.max(0, Number(activity.volunteers.split('/')[0]) - 1)}/${activity.volunteers.split('/')[1]}`,
              participantCount: Math.max(0, (activity.participantCount || 0) - 1),
            }
          : activity
      )))
      setRegisteredActivities((current) => current.filter((id) => id !== cancelActivity.id))
      setCancelActivity(null)
    } catch (requestError) {
      alert(requestError.message)
    }
  }

  const activityCounts = activities.reduce((counts, activity) => {
    const status = activity.status || 'Upcoming'
    counts[status] += 1
    return counts
  }, { Upcoming: 0, Ongoing: 0, Completed: 0 })
  const activeActivities = sortSoonestFirst(activities.filter((activity) => activity.status !== 'Completed'))
  const pastActivities = sortLatestFirst(activities.filter((activity) => activity.status === 'Completed'))
  const visibleActivities = view === 'past'
    ? pastActivities
    : activeActivities.filter((activity) => activityFilter === 'All' || activity.status === activityFilter)

  if (loading) {
    return (
      <div className="mx-auto max-w-[1450px] p-5 lg:p-8">
        <div className="mb-7 h-10 w-56 animate-pulse rounded-xl bg-eco-100" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="eco-card h-[380px] animate-pulse bg-white/70" />
          ))}
        </div>
      </div>
    )
  }
  if (error) return <div className="p-8"><div className="eco-empty border-red-200 bg-red-50 text-red-700">{error}</div></div>

  const isFull = (activity) => (
    activity.participantCount >= activity.volunteerLimit && !registeredActivities.includes(activity.id)
  )
  // Registration closes when the activity day starts.
  const isClosedToday = (activity) => (
    activity.status === 'Ongoing' && !registeredActivities.includes(activity.id)
  )

  return (
    <div className="relative mx-auto max-w-[1450px] p-5 lg:p-8">
      <PageHeader title="Activities" subtitle="Find an activity and register to volunteer.">
        <div role="tablist" aria-label="Activity lists" className="inline-flex gap-1 rounded-2xl bg-eco-100/70 p-1">
          {[
            { key: 'active', label: 'Active', count: activeActivities.length },
            { key: 'past', label: 'Past events', count: pastActivities.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={view === tab.key}
              onClick={() => setView(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-extrabold transition ${
                view === tab.key
                  ? tab.key === 'past' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-eco-800 shadow-sm'
                  : 'text-eco-700 hover:bg-white/60'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${view === tab.key && tab.key === 'past' ? 'bg-white/20' : 'bg-black/5'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </PageHeader>

      {view === 'active' ? (
        <div className="-mt-3 mb-5 flex flex-wrap gap-2">
          {[
            { key: 'All', label: 'All active', count: activeActivities.length },
            { key: 'Upcoming', label: 'Upcoming', count: activityCounts.Upcoming },
            { key: 'Ongoing', label: 'Today', count: activityCounts.Ongoing },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActivityFilter(filter.key)}
              className={`eco-chip ${activityFilter === filter.key ? 'eco-chip-active' : ''}`}
            >
              {filter.label}
              <span className="eco-chip-count">{filter.count}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="-mt-3 mb-5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Clock size={13} /> Finished activities. You can't join these anymore. Most recent first.
        </p>
      )}

      {visibleActivities.length === 0 && (
        <div className="eco-empty py-12">
          <Leaf size={26} className="text-eco-400" />
          {view === 'past' ? 'No past events yet.' : 'No activities in this category yet.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleActivities.map((activity, index) => {
          const registered = registeredActivities.includes(activity.id)
          const past = activity.status === 'Completed'
          const limit = Number(activity.volunteerLimit) || 0
          const count = Number(activity.participantCount ?? String(activity.volunteers).split('/')[0]) || 0
          const fillPercent = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0
          return (
            <article
              key={activity.id}
              style={{ '--ecotask-delay': `${(index % 6) * 70}ms` }}
              className="ecotask-card-enter eco-card eco-card-hover group flex flex-col overflow-hidden"
            >
              <div className="relative h-[190px] w-full overflow-hidden bg-eco-50">
                <img
                  src={activity.image}
                  alt={activity.title}
                  className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${past ? 'grayscale' : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-eco-950/60 via-transparent to-transparent" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <StatusBadge status={activity.status} />
                </div>
                {registered && (
                  <span className={`eco-badge absolute right-3 top-3 shadow-md ${past ? 'border border-slate-500 bg-slate-700 text-white' : 'eco-badge-solid'}`}>
                    <CheckCircle size={12} /> {past ? 'You joined' : 'Registered'}
                  </span>
                )}
                <p className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Calendar size={13} /> {activity.date}
                </p>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-[15px] font-extrabold uppercase tracking-wide text-gray-800">
                  {activity.title}
                </h3>
                {activity.organizerName && (
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-eco-700">
                    <Building2 size={12} /> {activity.organizerName}
                  </p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center gap-2">
                    <MapPin size={13} className="shrink-0 text-eco-600" />
                    <span className="truncate">{activity.location}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Landmark size={13} className="shrink-0 text-eco-600" />
                    <span className="truncate">{activity.landmark}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={13} className="shrink-0 text-eco-600" />
                    <span className="truncate">{activity.time}</span>
                  </p>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Users size={12} className="text-eco-600" /> {count}/{limit || '—'} volunteers
                    </span>
                    {isClosedToday(activity) ? (
                      <span className="eco-badge border border-amber-200 bg-amber-50 text-amber-700">Registration closed</span>
                    ) : !past && isFull(activity) && <span className="eco-badge eco-badge-red">Full</span>}
                  </div>
                  <div className="eco-progress"><span style={{ width: `${fillPercent}%` }} /></div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-eco-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(activity)}
                    className={`eco-btn eco-btn-sm ${past ? 'eco-btn-secondary' : 'eco-btn-primary'}`}
                  >
                    View details <ChevronRight size={14} />
                  </button>
                  {past && registered && goTo && (
                    <button type="button" onClick={() => goTo('records')} className="eco-btn eco-btn-primary eco-btn-sm">
                      See my record
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* MODALS */}
      {selectedActivity && createPortal((
        <div
          className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="ecotask-modal-panel eco-modal w-full max-w-[580px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[210px] w-full overflow-hidden bg-eco-50">
              <img
                src={selectedActivity.image}
                alt={selectedActivity.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-eco-950/70 via-eco-950/10 to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                aria-label="Go back to activities"
                className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-eco-700 shadow-md backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-eco-400"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="absolute right-4 top-4"><StatusBadge status={selectedActivity.status} /></div>
              <div className="absolute bottom-4 left-5 right-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eco-200">Activity details</p>
                <h2 className="mt-1 line-clamp-2 text-xl font-extrabold uppercase text-white">
                  {selectedActivity.title}
                </h2>
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  { icon: MapPin, label: 'Location', value: selectedActivity.location },
                  { icon: Calendar, label: 'Date', value: selectedActivity.date },
                  { icon: Landmark, label: 'Meeting place', value: selectedActivity.landmark },
                  { icon: Clock, label: 'Time', value: selectedActivity.time },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-eco-100 bg-eco-50/50 px-3 py-2.5">
                    <span className="eco-icon-tile-soft h-8 w-8 rounded-lg"><Icon size={14} /></span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
                      <span className="block truncate text-sm font-semibold text-gray-700">{value}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-eco-700">
                <span className="flex items-center gap-2"><Users size={14} /> {selectedActivity.volunteers}</span>
                {selectedActivity.organizerName && (
                  <span className="flex items-center gap-1.5 text-gray-500"><Building2 size={13} /> Organized by {selectedActivity.organizerName}</span>
                )}
              </div>

              <p className="mt-3 max-w-full rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-left text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
                {selectedActivity.description || 'No description provided.'}
              </p>

              <div className="mt-4 flex justify-start">
                {reportedIds.includes(String(selectedActivity.id)) ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                    <Flag size={12} /> You reported this activity
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReportActivity(selectedActivity)
                      setSelectedActivity(null)
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Flag size={12} /> Report this activity
                  </button>
                )}
              </div>

              {selectedActivity.status !== 'Completed' && (
                <div className="mt-3 flex justify-end gap-2 border-t border-eco-100 pt-4">
                  <button type="button" onClick={() => setSelectedActivity(null)} className="eco-btn eco-btn-secondary">
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={isFull(selectedActivity) || isClosedToday(selectedActivity)}
                    onClick={() => {
                      if (isFull(selectedActivity) || isClosedToday(selectedActivity)) return
                      if (registeredActivities.includes(selectedActivity.id)) {
                        setCancelActivity(selectedActivity)
                      } else {
                        setRegistrationActivity(selectedActivity)
                      }
                      setSelectedActivity(null)
                    }}
                    className={`eco-btn ${
                      isFull(selectedActivity) || isClosedToday(selectedActivity)
                        ? 'eco-btn-muted'
                        : registeredActivities.includes(selectedActivity.id)
                        ? 'eco-btn-danger-soft'
                        : 'eco-btn-primary'
                    }`}
                  >
                    {isClosedToday(selectedActivity)
                      ? 'REGISTRATION CLOSED'
                      : isFull(selectedActivity)
                      ? 'EVENT FULL'
                      : registeredActivities.includes(selectedActivity.id) ? 'CANCEL REGISTRATION' : 'REGISTER'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}

      {reportActivity && (
        <ReportActivityModal
          activity={reportActivity}
          onClose={() => setReportActivity(null)}
          onReported={(message) => {
            setReportedIds((current) => [...current, String(reportActivity.id)])
            setReportActivity(null)
            setPageNotice(message)
            window.setTimeout(() => setPageNotice(''), 5000)
          }}
        />
      )}

      {pageNotice && (
        <div className="fixed bottom-6 left-1/2 z-[400] -translate-x-1/2 rounded-xl border border-eco-200 bg-white px-4 py-3 text-sm font-semibold text-eco-800 shadow-xl">
          {pageNotice}
        </div>
      )}

      {registrationActivity && (
        <div
          className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setRegistrationActivity(null)}
        >
          <div
            className="ecotask-modal-panel eco-modal w-full max-w-[380px] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="eco-icon-tile mx-auto h-12 w-12 rounded-2xl"><Leaf size={22} /></span>
            <h2 className="mt-4 text-base font-extrabold text-gray-800">
              Confirm registration
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              You're about to register for{' '}
              <span className="font-bold text-eco-700">{registrationActivity.title}</span>{' '}
              on <span className="font-semibold">{registrationActivity.date}</span>.
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => setRegistrationActivity(null)} className="eco-btn eco-btn-secondary">
                Cancel
              </button>
              <button onClick={() => joinActivity()} className="eco-btn eco-btn-primary px-6">
                Yes, register
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelActivity && (
        <div
          className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[300] flex items-center justify-center p-4"
          onClick={() => setCancelActivity(null)}
        >
          <div
            className="ecotask-modal-panel eco-modal w-full max-w-[380px] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
              <XCircle size={22} />
            </span>
            <h2 className="mt-4 text-base font-extrabold text-gray-800">
              Cancel registration?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              You'll leave <span className="font-bold text-gray-800">{cancelActivity.title}</span> on{' '}
              <span className="font-semibold">{cancelActivity.date}</span>. Your spot will open up for another volunteer.
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => setCancelActivity(null)} className="eco-btn eco-btn-primary">
                Keep my spot
              </button>
              <button onClick={() => leaveActivity()} className="eco-btn eco-btn-danger">
                Yes, unregister
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   REPORT ACTIVITY MODAL
========================================================= */

const REPORT_REASONS = [
  'Misleading or false information',
  'Inappropriate content',
  'Scam or suspicious activity',
  'Safety concern',
  'Activity did not happen',
  'Other',
]

function ReportActivityModal({ activity, onClose, onReported }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!reason) return setError('Please choose a reason.')
    if (reason === 'Other' && details.trim().length < 10) return setError('Please describe the problem (at least 10 characters).')

    setSubmitting(true)
    setError('')
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ activityId: activity.id, reason, details: details.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to submit report')
      onReported(data.message)
    } catch (requestError) {
      setError(requestError.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="ecotask-modal-panel eco-modal w-full max-w-[440px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
            <Flag size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-gray-800">Report activity</h2>
            <p className="truncate text-xs text-gray-500">{activity.title}</p>
          </div>
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">What's wrong?</p>
        <div className="mt-2 space-y-1.5">
          {REPORT_REASONS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
                reason === option ? 'border-red-300 bg-red-50 text-red-800' : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={option}
                checked={reason === option}
                onChange={() => { setReason(option); setError('') }}
                className="accent-red-600"
              />
              {option}
            </label>
          ))}
        </div>

        <label className="eco-label mt-4">Details {reason === 'Other' ? '(required)' : '(optional)'}</label>
        <textarea
          rows={3}
          maxLength={500}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Tell the admin what happened..."
          className="eco-input resize-y"
        />
        <p className="mt-1 text-right text-[11px] text-gray-400">{details.length}/500</p>

        <p className="mt-1 text-[11px] text-gray-500">Your name is shared only with the admin, not with the organizer.</p>

        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="eco-btn eco-btn-secondary">Cancel</button>
          <button type="button" onClick={submit} disabled={submitting} className="eco-btn eco-btn-danger">
            {submitting ? 'Submitting...' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   SCHEDULE
========================================================= */

function Schedule() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const response = await fetch(`${API_BASE_URL}/api/activities`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load schedule')
        const recordsResponse = await fetch(`${API_BASE_URL}/api/participation/my-records`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        const records = await recordsResponse.json()
        const joinedActivityIds = new Set(
          recordsResponse.ok ? records.map((record) => String(record.activityId)) : []
        )
        const scheduleActivities = data.length > 0
          ? data
          : records.filter((record) => record.date).map((record) => ({
            _id: record.activityId || record._id,
            title: record.activityTitle,
            date: record.date,
            time: record.time,
            location: record.location,
            participants: [userInfo._id],
            volunteerLimit: 1,
          }))
        setEvents(scheduleActivities
          .filter((activity) => activity.date)
          .map((activity) => ({
            id: activity._id,
            date: activity.date,
            dateKey: getDateKey(activity.date),
            title: activity.title || 'Untitled activity',
            time: activity.time || activity.tasks?.[0] || 'Time not specified',
            location: activity.location || 'Location not specified',
            description: activity.description || '',
            status: getActivityStatus(activity.date),
            participantCount: activity.participants?.length || activity.participantCount || 0,
            volunteerLimit: activity.volunteerLimit,
            joined: joinedActivityIds.has(String(activity._id)) ||
              (activity.participants || []).some((participant) => (
                String(participant._id || participant) === String(userInfo._id)
              )),
          }))
          .sort((a, b) => (
            (a.status === 'Completed' ? 1 : 0) - (b.status === 'Completed' ? 1 : 0) ||
            (new Date(a.date) - new Date(b.date))
          )))
      } catch (error) {
        console.error(error)
      }
    }

    loadSchedule()
  }, [])

  const calendarDate = new Date()
  const calendarYear = calendarDate.getFullYear()
  const calendarMonth = calendarDate.getMonth()
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const firstDayOffset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7
  const monthKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`
  const monthlyEvents = events.filter((event) => event.dateKey.startsWith(monthKey))
  const todayDate = calendarDate.getDate()

  const monthLabel = calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const joinedThisMonth = monthlyEvents.filter((event) => event.joined).length

  return (
    <div className="mx-auto max-w-[1450px] p-5 lg:p-8">
      <PageHeader
        title="My Schedule"
        subtitle={`${joinedThisMonth} joined activit${joinedThisMonth === 1 ? 'y' : 'ies'} in ${monthLabel}`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* CALENDAR */}
        <div className="eco-card overflow-hidden">
          <div className="eco-card-header">
            <h2 className="eco-section-title">
              <span className="eco-icon-tile h-8 w-8 rounded-lg"><Calendar size={15} /></span>
              {monthLabel}
            </h2>
          </div>

          <div className="p-5 md:p-7">
            <div className="mb-3 grid grid-cols-7 text-center">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                <span key={day} className={`text-[11px] font-extrabold tracking-wider ${day === 'SAT' || day === 'SUN' ? 'text-eco-600' : 'text-gray-500'}`}>
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-3 text-center">
              {Array.from({ length: firstDayOffset }).map((_, index) => <span key={`empty-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((date) => {
                const dateEvents = monthlyEvents.filter((event) => Number(event.dateKey.slice(8, 10)) === date)
                const joinedEvents = dateEvents.filter((event) => event.joined)
                const joinedOnDate = joinedEvents.length > 0
                return (
                  <CalendarDate
                    key={date}
                    number={date}
                    isToday={date === todayDate}
                    isPast={date < todayDate}
                    joined={joinedOnDate}
                    joinedTitle={joinedEvents.map((event) => event.title).join(', ')}
                  />
                )
              })}
            </div>

            {/* LEGEND */}
            <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-eco-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-eco-700 shadow-sm" />
                <span className="text-xs font-semibold text-gray-600">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-eco-200" />
                <span className="text-xs font-semibold text-gray-600">Joined activity</span>
              </div>
              <span className="text-[11px] text-gray-400">Hover a highlighted day to see the activity.</span>
            </div>
          </div>
        </div>

        {/* EVENTS THIS MONTH */}
        <div className="eco-card h-fit overflow-hidden">
          <div className="eco-card-header">
            <h2 className="eco-section-title">
              <span className="eco-icon-tile h-8 w-8 rounded-lg"><Leaf size={15} /></span>
              Events this month
            </h2>
            <span className="eco-badge eco-badge-green">{monthlyEvents.length}</span>
          </div>

          <div className="eco-scroll max-h-[560px] space-y-2.5 overflow-y-auto p-4">
            {monthlyEvents.map((event) => {
              const day = new Date(event.date)
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3.5 rounded-2xl border p-2.5 pr-3.5 transition hover:shadow-sm ${
                    event.joined ? 'border-eco-200 bg-eco-50/60' : 'border-gray-100 bg-white'
                  } ${event.status === 'Completed' ? 'opacity-70' : ''}`}
                >
                  <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${
                    event.joined ? 'bg-gradient-to-br from-eco-600 to-eco-700 text-white shadow-md' : 'border border-eco-100 bg-eco-50 text-eco-700'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${event.joined ? 'text-eco-100' : 'text-eco-600'}`}>
                      {day.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-xl font-extrabold leading-none">{day.getDate()}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800">{event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                      <Clock size={12} className="shrink-0 text-eco-600" /> {event.time}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                      <MapPin size={12} className="shrink-0 text-eco-600" /> {event.location}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`eco-badge ${event.joined ? 'eco-badge-green' : 'eco-badge-gray'}`}>
                      {event.joined ? 'Joined' : 'Not joined'}
                    </span>
                    {event.participantCount >= event.volunteerLimit && (
                      <span className="eco-badge eco-badge-red">Full</span>
                    )}
                  </div>
                </div>
              )
            })}
            {monthlyEvents.length === 0 && (
              <div className="eco-empty">
                <Calendar size={22} className="text-eco-400" />
                No activities scheduled this month.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CalendarDate({
  number,
  isToday = false,
  isPast = false,
  joined = false,
  joinedTitle = '',
}) {
  // Today = dark green. Joined activity = light green.
  // If today also has a joined activity, keep dark green and add a light green ring.
  let dayStyle = `${isPast ? 'text-gray-400' : 'text-gray-700'} font-semibold hover:bg-eco-50`
  if (isToday && joined) {
    dayStyle = 'bg-eco-700 text-white font-bold shadow-lg shadow-eco-700/30 ring-4 ring-eco-200'
  } else if (isToday) {
    dayStyle = 'bg-eco-700 text-white font-bold shadow-lg shadow-eco-700/30'
  } else if (joined) {
    dayStyle = 'bg-eco-200 text-eco-800 font-bold hover:bg-eco-300/70'
  }

  return (
    <div
      aria-current={isToday ? 'date' : undefined}
      className={`group relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition md:h-11 md:w-11 md:text-base ${dayStyle} ${joined ? 'cursor-pointer' : ''}`}
    >
      {number}
      {joined && !isToday && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-eco-700" />}
      {joinedTitle && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-48 -translate-x-1/2 rounded-lg bg-eco-800 px-2.5 py-1.5 text-[11px] font-semibold leading-tight text-white shadow-lg group-hover:block">
          {joinedTitle}
        </span>
      )}
    </div>
  )
}

/* =========================================================
   PARTICIPATION RECORD
========================================================= */

function Records() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const recordsResponse = await fetch(`${API_BASE_URL}/api/participation/my-records`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        const recordsData = await recordsResponse.json()
        if (!recordsResponse.ok) throw new Error(recordsData.message || 'Unable to load records')
        setRecords(recordsData)
      } catch (error) {
        setLoadError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadRecords()
  }, [])

  // Upcoming activities (attendance not marked yet) stay on My Schedule.
  const history = records
    .filter((record) => ['present', 'late', 'absent'].includes(record.attendance))
    .sort((x, y) => new Date(y.date || 0) - new Date(x.date || 0))
  const attendedCount = history.filter((record) => record.attendance !== 'absent').length
  const missedCount = history.length - attendedCount
  const attendanceRate = history.length ? Math.round((attendedCount / history.length) * 100) : 0

  const downloadCertificate = (activity) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const certificate = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = certificate.internal.pageSize.getWidth()
    const pageHeight = certificate.internal.pageSize.getHeight()
    const volunteerName = userInfo.name || 'Volunteer'

    certificate.setFillColor(232, 245, 233)
    certificate.rect(0, 0, pageWidth, pageHeight, 'F')
    certificate.setDrawColor(27, 94, 32)
    certificate.setLineWidth(2)
    certificate.rect(10, 10, pageWidth - 20, pageHeight - 20)
    certificate.setDrawColor(102, 187, 106)
    certificate.setLineWidth(0.6)
    certificate.rect(15, 15, pageWidth - 30, pageHeight - 30)

    certificate.setTextColor(27, 94, 32)
    certificate.setFont('helvetica', 'bold')
    certificate.setFontSize(14)
    certificate.text('ECOTASK', pageWidth / 2, 35, { align: 'center' })
    certificate.setFontSize(28)
    certificate.text('CERTIFICATE OF PARTICIPATION', pageWidth / 2, 55, { align: 'center' })

    certificate.setTextColor(55, 65, 81)
    certificate.setFont('helvetica', 'normal')
    certificate.setFontSize(13)
    certificate.text('This certificate is proudly presented to', pageWidth / 2, 75, { align: 'center' })
    certificate.setTextColor(27, 94, 32)
    certificate.setFont('helvetica', 'bold')
    certificate.setFontSize(24)
    certificate.text(volunteerName, pageWidth / 2, 91, { align: 'center' })

    certificate.setTextColor(55, 65, 81)
    certificate.setFont('helvetica', 'normal')
    certificate.setFontSize(13)
    certificate.text('for their valuable participation in', pageWidth / 2, 108, { align: 'center' })
    certificate.setFont('helvetica', 'bold')
    certificate.setFontSize(18)
    certificate.text(activity.title, pageWidth / 2, 122, { align: 'center', maxWidth: pageWidth - 70 })
    certificate.setFont('helvetica', 'normal')
    certificate.setFontSize(11)
    certificate.text(`${activity.date} | ${activity.location}`, pageWidth / 2, 137, { align: 'center', maxWidth: pageWidth - 70 })

    certificate.setDrawColor(27, 94, 32)
    certificate.line(35, 160, 95, 160)
    certificate.line(pageWidth - 95, 160, pageWidth - 35, 160)
    certificate.setFontSize(9)
    certificate.text('EcoTask Volunteer Program', 65, 166, { align: 'center' })
    certificate.text(`Certificate ID: ${activity.certificateId || 'N/A'}`, pageWidth - 65, 166, { align: 'center' })

    certificate.save(`ecotask-certificate-${String(activity.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'participation'}.pdf`)
  }

  const certificates = history.filter((record) => record.certificateIssued)
  const visibleRecords = history.filter((record) => {
    if (filter === 'attended') return record.attendance !== 'absent'
    if (filter === 'missed') return record.attendance === 'absent'
    if (filter === 'certificates') return record.certificateIssued
    return true
  })
  const tabs = [
    { key: 'all', label: 'All', count: history.length },
    { key: 'attended', label: 'Attended', count: attendedCount },
    { key: 'missed', label: 'Missed', count: missedCount },
    { key: 'certificates', label: 'Certificates', count: certificates.length },
  ]

  return (
    <div className="mx-auto max-w-[1280px] p-5 lg:p-8">
      <PageHeader title="Participation Record" subtitle="Your volunteering history, attendance, and certificates." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="eco-card flex items-center gap-4 p-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(#2e7d32 ${attendanceRate}%, #e5efe5 0)` }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-extrabold text-eco-800">
              {attendanceRate}%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Attendance rate</p>
            <p className="text-sm font-bold text-eco-800">{attendedCount} of {history.length} attended</p>
          </div>
        </div>
        <StatCard title="Activities Joined" value={history.length} icon={<Leaf size={18} />} />
        <StatCard title="Activities Attended" value={attendedCount} icon={<CheckCircle size={18} />} />
        <StatCard title="Certificates Earned" value={certificates.length} icon={<Award size={18} />} />
      </div>

      {loadError && (
        <div className="eco-empty mb-4 text-red-600">{loadError}</div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition ${
              filter === tab.key
                ? 'border-eco-800 bg-eco-800 text-white'
                : 'border-eco-100 bg-white text-gray-600 hover:bg-eco-50'
            }`}
          >
            {tab.label} <span className="opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="eco-card h-20 animate-pulse bg-white/70" />)}
        </div>
      )}

      {!loading && (
        <div className="eco-card overflow-hidden">
          {visibleRecords.map((record) => {
            const missed = record.attendance === 'absent'
            const late = record.attendance === 'late'
            return (
              <div
                key={record._id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-eco-100/60 px-4 py-3.5 last:border-b-0 sm:px-5"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${missed ? 'bg-gray-100 text-gray-400' : 'bg-eco-50 text-eco-600'}`}>
                  <TreePine size={18} />
                </span>
                <div className="min-w-[180px] flex-1">
                  <p className={`truncate text-sm font-bold ${missed ? 'text-gray-500' : 'text-gray-800'}`}>{record.activityTitle}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                    <MapPin size={12} className="shrink-0" /> {record.location || 'See activity details'}
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-gray-600 sm:w-[130px]">
                  <Calendar size={12} className="shrink-0 text-eco-600" />
                  {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                </p>
                <div className="sm:w-[120px]">
                  {missed
                    ? <span className="eco-badge bg-gray-100 text-gray-500">Did not attend</span>
                    : <span className="eco-badge eco-badge-green"><CheckCircle size={11} /> {late ? 'Late' : 'Present'}</span>}
                </div>
                <div className="flex justify-end sm:w-[150px]">
                  {record.certificateIssued ? (
                    <button
                      type="button"
                      onClick={() => downloadCertificate({
                        id: record._id,
                        certificateId: record.certificateId,
                        title: record.activityTitle,
                        date: record.date ? new Date(record.date).toLocaleDateString() : '-',
                        location: record.location || 'See activity details',
                      })}
                      className="eco-btn eco-btn-primary eco-btn-sm"
                    >
                      <Download size={13} /> Certificate
                    </button>
                  ) : missed ? (
                    <span className="text-xs text-gray-400">No certificate</span>
                  ) : (
                    <span className="text-xs text-gray-500">Certificate pending</span>
                  )}
                </div>
              </div>
            )
          })}
          {visibleRecords.length === 0 && (
            <div className="eco-empty border-0">
              <Sparkles size={22} className="text-eco-400" />
              {filter === 'certificates'
                ? 'No certificates issued yet. Attend an activity to earn one.'
                : filter === 'missed'
                  ? 'No missed activities. Great job!'
                  : 'No records here yet.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   ANNOUNCEMENT
========================================================= */

function Announcement() {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const response = await fetch(`${API_BASE_URL}/api/announcements`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load announcements')
        setAnnouncements(data)
      } catch (error) {
        console.error(error)
      }
    }

    loadAnnouncements()
  }, [])

  const filteredAnnouncements = announcements.filter((item) => {
    if (activeFilter === 'ALL') return true
    return item.category?.toUpperCase() === activeFilter
  })

  const newAnnouncements = filteredAnnouncements.slice(0, 3)
  const recentAnnouncements = filteredAnnouncements.slice(3)

  const categoryTone = (category = '') => {
    const value = category.toUpperCase()
    if (value === 'IMPORTANT') return 'red'
    if (value === 'ORGANIZER UPDATES') return 'blue'
    return 'green'
  }

  return (
    <div className="mx-auto max-w-[1100px] p-5 lg:p-8">
      <PageHeader title="Announcements" subtitle="Updates and reminders from the EcoTask organizers.">
        {[
          { key: 'ALL', label: 'All', icon: null },
          { key: 'IMPORTANT', label: 'Important', icon: <Bell size={12} /> },
          { key: 'ORGANIZER UPDATES', label: 'Organizer updates', icon: <Megaphone size={12} /> },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`eco-chip ${activeFilter === filter.key ? 'eco-chip-active' : ''}`}
          >
            {filter.icon}
            {filter.label}
          </button>
        ))}
      </PageHeader>

      {newAnnouncements.length > 0 && (
        <section>
          <p className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-eco-700">
            <span className="h-2 w-2 rounded-full bg-eco-500 shadow-[0_0_0_4px_rgba(102,187,106,0.25)]" />
            Latest
          </p>

          <div className="space-y-3">
            {newAnnouncements.map((item) => (
              <AnnouncementCard
                key={item._id}
                icon={<Bell size={16} />}
                title={item.title}
                category={item.category}
                tone={categoryTone(item.category)}
                posted={`${item.author?.name || 'Admin'} • ${new Date(item.createdAt).toLocaleString()}`}
                editedAt={item.editedAt}
                text={item.description || item.message}
                highlight
              />
            ))}
          </div>
        </section>
      )}

      {recentAnnouncements.length > 0 && (
        <section className="mt-8">
          <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-gray-500">
            Earlier
          </p>

          <div className="space-y-3">
            {recentAnnouncements.map((item) => (
              <AnnouncementCard
                key={item._id}
                icon={<Megaphone size={16} />}
                title={item.title}
                category={item.category}
                tone={categoryTone(item.category)}
                posted={`${item.author?.name || 'Admin'} • ${new Date(item.createdAt).toLocaleString()}`}
                editedAt={item.editedAt}
                text={item.description || item.message}
              />
            ))}
          </div>
        </section>
      )}

      {filteredAnnouncements.length === 0 && (
        <div className="eco-empty py-12">
          <Megaphone size={24} className="text-eco-400" />
          No announcements found for this category.
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({ icon, title, category, tone = 'green', posted, editedAt, text, highlight = false }) {
  const toneStyles = {
    green: { bar: 'from-eco-400 to-eco-700', tile: 'eco-icon-tile', badge: 'eco-badge-green' },
    red: { bar: 'from-red-300 to-red-500', tile: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600', badge: 'eco-badge-red' },
    blue: { bar: 'from-sky-300 to-sky-600', tile: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700', badge: 'eco-badge-blue' },
  }[tone]

  return (
    <article className={`eco-card eco-card-hover overflow-hidden py-5 pl-6 pr-5 ${highlight ? 'bg-gradient-to-r from-eco-50/70 to-white' : ''}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${toneStyles.bar}`} />
      <div className="flex items-start gap-4">
        <span className={toneStyles.tile}>{icon}</span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-gray-800">{title}</h3>
            {category && <span className={`eco-badge ${toneStyles.badge}`}>{category}</span>}
          </div>

          <p className="mt-0.5 text-xs font-medium text-gray-400">
            {posted}
            {editedAt && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-500" title={new Date(editedAt).toLocaleString()}>
                Edited · {new Date(editedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </p>

          <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere]">{text}</p>
        </div>
      </div>
    </article>
  )
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({ onProfileUpdated }) {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [profile, setProfile] = useState(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return {
      fullName: userInfo.name || '',
      phoneNumber: userInfo.phone || '',
      email: userInfo.email || '',
    }
  })
  const [saving, setSaving] = useState(false)

  const [formState, setFormState] = useState({
    ...profile,
    newPassword: '',
    confirmPassword: '',
  })

  // Step 1: "Edit profile" asks for the current password (checked by the server).
  // Step 2: the form unlocks; saving sends the same password again so the server re-checks it.
  const [currentPassword, setCurrentPassword] = useState('')
  const [verifiedPassword, setVerifiedPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const getToken = () => JSON.parse(localStorage.getItem('userInfo') || '{}').token

  const resetForm = () => setFormState({ ...profile, newPassword: '', confirmPassword: '' })

  const handleEditClick = () => {
    setNotice('')
    setFormError('')
    setVerifyError('')
    setCurrentPassword('')
    setShowSaveModal(true)
  }

  const closeVerifyModal = () => {
    if (verifying) return
    setShowSaveModal(false)
    setCurrentPassword('')
    setVerifyError('')
  }

  const handleVerify = async (e) => {
    e?.preventDefault()
    if (!currentPassword) {
      setVerifyError('Enter your current password.')
      return
    }
    try {
      setVerifying(true)
      setVerifyError('')
      const response = await fetch(`${API_BASE_URL}/api/users/me/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ currentPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setVerifyError(data.message || 'Unable to confirm your password.')
        return
      }
      setVerifiedPassword(currentPassword)
      setCurrentPassword('')
      setShowSaveModal(false)
      resetForm()
      setIsEditing(true)
    } catch (error) {
      setVerifyError(error.message === 'Failed to fetch' ? "Can't reach the server. Please try again." : error.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    setFormError('')
    setVerifiedPassword('')
    setIsEditing(false)
  }

  const handleSaveClick = async () => {
    setNotice('')
    const name = formState.fullName.trim()
    const phone = formState.phoneNumber.trim()
    if (!name) {
      setFormError('Full name is required.')
      return
    }
    if (formState.newPassword !== formState.confirmPassword) {
      setFormError('New passwords do not match. Please try again.')
      return
    }
    if (name === profile.fullName && phone === profile.phoneNumber && !formState.newPassword) {
      setFormError('No changes to save.')
      return
    }
    setFormError('')

    try {
      setSaving(true)
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({
          currentPassword: verifiedPassword,
          name,
          phone,
          newPassword: formState.newPassword || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        // Password no longer matches (e.g. changed on another device): ask again.
        if (data.errors?.currentPassword) {
          handleCancel()
          setFormError('Please confirm your password again to edit your profile.')
          return
        }
        setFormError(data.message || 'Unable to save profile')
        return
      }

      const updatedProfile = {
        fullName: data.name,
        phoneNumber: data.phone || '',
        email: data.email,
      }
      setProfile(updatedProfile)
      setFormState({ ...updatedProfile, newPassword: '', confirmPassword: '' })
      // data.token is only sent after a password change (the old token stops working).
      const { message, ...userFields } = data
      localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...userFields }))
      onProfileUpdated?.(userFields)
      setVerifiedPassword('')
      setIsEditing(false)
      setNotice(message || 'Your profile changes have been saved.')
    } catch (error) {
      setFormError(error.message === 'Failed to fetch' ? "Can't reach the server. Please try again." : error.message)
    } finally {
      setSaving(false)
    }
  }

  const settingsInitials = (profile.fullName || 'V')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <div className="mx-auto max-w-[1450px] p-5 lg:p-8">
      <PageHeader title="Settings" subtitle="Manage your profile and password." />

      <div className="eco-card mx-auto w-full max-w-xl overflow-hidden">
        {/* PROFILE BANNER */}
        <div className="relative h-24 bg-gradient-to-r from-eco-700 via-eco-600 to-eco-400">
          <TreePine className="absolute -bottom-4 right-4 h-24 w-24 text-white/10" strokeWidth={1.2} />
        </div>
          <div className="relative z-10 -mt-10 flex flex-col items-center px-6 text-center">
          <div className="eco-avatar h-20 w-20 text-2xl shadow-lg" style={{ boxShadow: '0 0 0 4px #fff, 0 10px 25px -8px rgba(27,94,32,0.5)' }}>
            {settingsInitials}
          </div>
          <p className="mt-3 text-lg font-extrabold text-gray-800">{profile.fullName}</p>
          <p className="text-xs text-gray-500">{profile.email}</p>
          <span className="eco-badge eco-badge-green mt-2">Volunteer</span>

          {!isEditing && (
            <button onClick={handleEditClick} className="eco-btn eco-btn-primary eco-btn-sm mt-4">
              Edit profile
            </button>
          )}
        </div>

        <div className="p-6">
          <h2 className="eco-section-title mb-4">
            <User size={14} /> {isEditing ? 'Edit information' : 'User information'}
          </h2>

          {notice && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-xs font-bold text-eco-800">
              <CheckCircle size={15} className="shrink-0" /> {notice}
            </div>
          )}
          {formError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <SettingsInput
              label="Full Name"
              value={formState.fullName}
              disabled={!isEditing}
              onChange={(val) => setFormState({ ...formState, fullName: val })}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SettingsInput
                label="Phone Number"
                value={formState.phoneNumber}
                disabled={!isEditing}
                onChange={(val) => setFormState({ ...formState, phoneNumber: val })}
              />

              <div>
                <SettingsInput
                  label="Email"
                  value={formState.email}
                  disabled
                />
                {isEditing && (
                  <p className="mt-1 text-[11px] font-medium text-gray-400">Your email was verified at sign-up and can't be changed.</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-eco-100 bg-eco-50/40 p-4 sm:grid-cols-2">
                <p className="text-xs font-semibold text-gray-500 sm:col-span-2">
                  Leave the password fields empty to keep your current password. A new password logs you out of other devices.
                </p>
                <SettingsInput
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={formState.newPassword}
                  disabled={!isEditing}
                  onChange={(val) =>
                    setFormState({ ...formState, newPassword: val })
                  }
                />

                <SettingsInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={formState.confirmPassword}
                  disabled={!isEditing}
                  onChange={(val) =>
                    setFormState({ ...formState, confirmPassword: val })
                  }
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end gap-2 border-t border-eco-100 pt-4">
              <button onClick={handleCancel} disabled={saving} className="eco-btn eco-btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveClick} disabled={saving} className="eco-btn eco-btn-primary">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showSaveModal && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={closeVerifyModal} />
          <form onSubmit={handleVerify} className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-[380px] p-6">
            <div className="text-center">
              <span className="eco-icon-tile mx-auto h-12 w-12 rounded-2xl"><Lock size={20} /></span>
              <h2 className="mt-4 text-base font-extrabold text-gray-800">
                Confirm it's you
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Enter your current password to edit your name, phone number, or password.
              </p>
            </div>

            <div className="mt-5 text-left">
              <SettingsInput
                label="Current Password"
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(val) => { setCurrentPassword(val); setVerifyError('') }}
                autoFocus
                autoComplete="current-password"
              />
              {verifyError && <p className="mt-1.5 text-xs font-semibold text-rose-600">{verifyError}</p>}
            </div>

            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={closeVerifyModal} disabled={verifying} className="eco-btn eco-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={verifying} className="eco-btn eco-btn-primary px-6">
                {verifying ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function SettingsInput({
  label,
  value,
  onChange,
  disabled = false,
  type = 'text',
  placeholder = '',
  autoFocus = false,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPasswordField = type === 'password'

  return (
    <div>
      <label className="eco-label">
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          type={isPasswordField && showPassword ? 'text' : type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          onChange={(e) => onChange && onChange(e.target.value)}
          className={`eco-input ${isPasswordField ? 'pr-10' : ''}`}
        />

        {isPasswordField && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 text-gray-400 transition hover:text-eco-700 focus:outline-none"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}
