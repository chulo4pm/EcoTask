import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Droplets,
  Edit3,
  FolderOpen,
  Home,
  Layers,
  LogOut,
  MapPin,
  Menu,
  PlayCircle,
  PlusCircle,
  Search,
  Sprout,
  Trash2,
  Trees,
  User,
  UserCheck,
  Users,
  UserX,
  X,
  Flag,
  Hourglass,
  RefreshCw,
  FileText,
  Upload,
  AlertTriangle,
  EyeOff,
  Building2,
  Ban,
} from 'lucide-react';
import NotificationBell from "./NotificationBell";
import { API_BASE_URL } from "./config";

// Sidebar Navigation Items
const navItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Create Activity', icon: PlusCircle },
  { label: 'Manage Activities', icon: FolderOpen },
  { label: 'Participation Record', icon: BookOpen },
  { label: 'Reports', icon: Flag },
];

const getOrganizerInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('organizerInfo') || '{}');
  } catch {
    return {};
  }
};

const getActivityImageUrl = (image) => (
  image?.startsWith('/uploads/') ? `${API_BASE_URL}${image}` : image
);

const getDateKey = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string') return dateValue.slice(0, 10);
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getActivityStatus = (dateValue) => {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const activityKey = getDateKey(dateValue);
  if (activityKey < todayKey) return 'Completed';
  if (activityKey === todayKey) return 'Ongoing';
  return 'Upcoming';
};

const sortActivitiesByStatus = (activities) => {
  const getTimeInMinutes = (activity) => {
    const time = activity.time || activity.tasks?.[0] || '';
    const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (!match) return 0;
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === 'PM') hour += 12;
    return hour * 60 + Number(match[2] || 0);
  };

  return [...activities].sort((a, b) => (
    (new Date(a.date) - new Date(b.date)) ||
    (getTimeInMinutes(a) - getTimeInMinutes(b))
  ));
};

/* ==========================================
   ORGANIZER DASHBOARD (entry)
   Checks the organizer's approval status first:
   pending  -> "waiting for admin approval" screen
   rejected -> reason + re-upload documents
   approved -> full organizer dashboard
   ========================================== */
export default function OrganizerDashboard({ onLogout }) {
  const [account, setAccount] = useState(() => getOrganizerInfo());
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState('');
  const [suspension, setSuspension] = useState(null); // { reason } when the admin suspended this account

  const refreshStatus = async () => {
    setChecking(true);
    setCheckError('');
    try {
      const info = getOrganizerInfo();
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${info.token}` },
      });
      const data = await response.json();
      if (response.status === 401) {
        if (onLogout) onLogout();
        return;
      }
      if (response.status === 403 && data.suspended) {
        setSuspension({ reason: data.suspendedReason || '' });
        return;
      }
      setSuspension(null);
      if (!response.ok) throw new Error(data.message || 'Unable to check your account status');
      const updated = { ...info, ...data };
      localStorage.setItem('organizerInfo', JSON.stringify(updated));
      setAccount(updated);
    } catch (error) {
      setCheckError(error.message === 'Failed to fetch' ? "Can't reach the server." : error.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []); // run once on page load

  if (checking && !account.organizerStatus) {
    return (
      <div className="eco-app-bg flex h-screen items-center justify-center">
        <p className="text-sm font-semibold text-eco-700">Checking your account...</p>
      </div>
    );
  }

  if (suspension) {
    return <OrganizerSuspendedScreen account={account} reason={suspension.reason} onRefresh={refreshStatus} checking={checking} onLogout={onLogout} />;
  }

  if (account.organizerStatus !== 'approved') {
    return (
      <OrganizerStatusScreen
        account={account}
        checking={checking}
        checkError={checkError}
        onRefresh={refreshStatus}
        onResubmitted={(user) => {
          const updated = { ...getOrganizerInfo(), ...user };
          localStorage.setItem('organizerInfo', JSON.stringify(updated));
          setAccount(updated);
        }}
        onLogout={onLogout}
      />
    );
  }

  return <OrganizerWorkspace account={account} onLogout={onLogout} />;
}

/* ==========================================
   SUSPENDED SCREEN
   ========================================== */
function OrganizerSuspendedScreen({ account, reason, checking, onRefresh, onLogout }) {
  return (
    <div className="eco-app-bg flex min-h-screen items-center justify-center p-4">
      <div className="eco-card w-full max-w-lg overflow-hidden text-slate-800">
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <Ban className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold">Account suspended</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The admin has suspended <span className="font-bold">{account.organizationName || account.name}</span>.
            You can't manage activities, and your activities are hidden from volunteers.
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
  );
}

/* ==========================================
   PENDING / REJECTED SCREEN
   ========================================== */
function OrganizerStatusScreen({ account, checking, checkError, onRefresh, onResubmitted, onLogout }) {
  const isRejected = account.organizerStatus === 'rejected';
  const [files, setFiles] = useState([]);
  const [organizationName, setOrganizationName] = useState(account.organizationName || '');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const addFiles = (fileList) => {
    setError('');
    const incoming = Array.from(fileList || []);
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    const bad = incoming.find((file) => !allowed.includes(file.type));
    if (bad) return setError(`${bad.name}: only JPG, PNG, or PDF files are allowed.`);
    const big = incoming.find((file) => file.size > 5 * 1024 * 1024);
    if (big) return setError(`${big.name} is larger than 5 MB.`);
    const next = [...files, ...incoming].slice(0, 3);
    if (files.length + incoming.length > 3) setError('You can upload up to 3 documents.');
    setFiles(next);
  };

  const resubmit = async () => {
    if (files.length === 0) return setError('Upload at least one document.');
    setSubmitting(true);
    setError('');
    try {
      const body = new FormData();
      body.append('organizationName', organizationName);
      files.forEach((file) => body.append('documents', file));
      const response = await fetch(`${API_BASE_URL}/api/auth/organizer/resubmit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getOrganizerInfo().token}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to resubmit documents');
      setMessage(data.message);
      setFiles([]);
      onResubmitted(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="eco-app-bg flex min-h-screen items-center justify-center p-4">
      {/* Outside the card (it clips overflow) so the notification list can open. */}
      <div className="fixed right-4 top-4 z-40">
        <NotificationBell storageKey="organizerInfo" />
      </div>
      <div className="eco-card w-full max-w-lg overflow-hidden">
        <div className={`relative px-6 pb-6 pt-8 text-center ${isRejected ? 'bg-gradient-to-br from-rose-50 to-white' : 'bg-gradient-to-br from-eco-50 to-white'}`}>
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            isRejected ? 'border border-rose-200 bg-rose-100 text-rose-600' : 'eco-icon-tile h-16 w-16 rounded-2xl'
          }`}>
            {isRejected ? <AlertTriangle className="h-8 w-8" /> : <Hourglass className="h-8 w-8" />}
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-800">
            {isRejected ? 'Application not approved' : 'Waiting for admin approval'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {isRejected
              ? 'The admin reviewed your documents and could not approve your organizer account yet.'
              : "The admin hasn't approved your organizer account yet. We'll unlock your dashboard as soon as your documents are verified."}
          </p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
            <Building2 className="h-3.5 w-3.5" /> {account.organizationName || account.name} · {account.email}
          </p>
        </div>

        <div className="space-y-4 p-6">
          {isRejected && (
            <>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Reason from admin</p>
                <p className="mt-1 [overflow-wrap:anywhere]">{account.rejectionReason || 'No reason given.'}</p>
              </div>

              <div>
                <label className="eco-label">Organization name</label>
                <input className="eco-input" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} maxLength={100} />
              </div>

              <div>
                <label className="eco-label">Upload new documents (JPG, PNG or PDF, max 5 MB each, up to 3)</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-eco-200 bg-eco-50/40 px-4 py-4 transition hover:border-eco-400">
                  <span className="eco-icon-tile-soft"><Upload className="h-5 w-5" /></span>
                  <span className="text-sm font-semibold text-slate-700">Choose files</span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                  />
                </label>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-eco-600" /><span className="truncate">{file.name}</span></span>
                        <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== index))} className="text-rose-600 hover:underline">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button type="button" onClick={resubmit} disabled={submitting} className="eco-btn eco-btn-primary w-full">
                <Upload className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Resubmit for review'}
              </button>
            </>
          )}

          {!isRejected && (
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-eco-600" /> Account created</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-eco-600" /> Documents uploaded</li>
              <li className="flex gap-2"><Hourglass className="h-4 w-4 shrink-0 text-amber-500" /> Admin review in progress</li>
            </ul>
          )}

          {message && <p className="rounded-xl border border-eco-200 bg-eco-50 p-3 text-xs font-semibold text-eco-800">{message}</p>}
          {(error || checkError) && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error || checkError}</p>}

          <div className="flex gap-2 border-t border-eco-100 pt-4">
            <button type="button" onClick={onRefresh} disabled={checking} className="eco-btn eco-btn-secondary flex-1">
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> Check status
            </button>
            <button type="button" onClick={onLogout} className="eco-btn eco-btn-muted flex-1">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Active list: today first, then the soonest. Past list: the most recent first.
const sortLatestFirst = (activities) => sortActivitiesByStatus(activities).reverse();

/* ==========================================
   APPROVED ORGANIZER WORKSPACE
   ========================================== */
function OrganizerWorkspace({ account, onLogout }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('All');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Set by a "New volunteer joined" notification: Manage Activities opens that activity's volunteer list.
  const [openVolunteersFor, setOpenVolunteersFor] = useState(null);

  const displayName = account.organizationName || account.name || 'Organizer';
  const pageMeta = {
    Dashboard: { title: `Hello, ${account.name?.split(' ')[0] || 'Organizer'}!`, subtitle: `Managing activities for ${displayName}.` },
    'Create Activity': { title: 'Create Activity', subtitle: 'Publish a new volunteer activity.' },
    'Manage Activities': { title: 'Manage Activities', subtitle: 'Edit your activities, view volunteers, and issue certificates.' },
    'Participation Record': { title: 'Participation Record', subtitle: 'Mark attendance for your activities.' },
    Reports: { title: 'Reports', subtitle: 'Reports volunteers submitted about your activities.' },
  };
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="eco-app-bg flex h-screen w-screen overflow-hidden font-sans text-slate-800 antialiased">
      {mobileMenuOpen && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={`eco-sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col px-3.5 py-5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-eco-100 hover:bg-white/10 lg:hidden"
          >
            <X className="h-[18px] w-[18px]" />
          </button>

          <div className="flex items-center justify-center border-b border-white/10 pb-5">
            <div className="flex items-center text-[26px] font-black tracking-tight text-white">
              <span>Ec</span>
              <span className="mx-[2px] inline-flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                  <circle cx="50" cy="50" r="42" stroke="#66BB6A" strokeWidth="12" fill="#1B5E20" />
                  <rect x="45" y="52" width="10" height="22" rx="3" fill="#66BB6A" />
                  <path d="M50 18 L30 48 H70 Z" fill="#66BB6A" />
                  <path d="M50 30 L36 54 H64 Z" fill="#A5D6A7" />
                </svg>
              </span>
              <span>Task</span>
            </div>
          </div>

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-eco-200/60">
            Organizer menu
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon }) => {
              const isActive = activeTab === label;
              return (
                <button
                  key={label}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => { setActiveTab(label); setMobileMenuOpen(false); }}
                  className={`eco-nav-item ${isActive ? 'eco-nav-item-active' : ''}`}
                >
                  <span className="eco-nav-item-icon"><Icon className="h-[18px] w-[18px]" /></span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="eco-header z-30 flex shrink-0 items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu" className="eco-icon-btn lg:hidden">
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-eco-600/80 sm:block">{todayLabel}</p>
              <h2 className="truncate text-lg font-extrabold text-eco-800">{activeTab === 'Dashboard' ? 'Organizer Dashboard' : activeTab}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
          <NotificationBell
            storageKey="organizerInfo"
            onOpen={(item) => {
              if (item.type === 'volunteer_joined') {
                setActivityFilter('All');
                setOpenVolunteersFor(item.activity || null);
                setActiveTab('Manage Activities');
              } else {
                setActiveTab('Dashboard');
              }
            }}
          />
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex h-10 items-center gap-2 rounded-full border border-eco-200/70 bg-white pl-1.5 pr-3 shadow-sm transition hover:bg-eco-50"
            >
              <div className="eco-avatar h-7 w-7 text-[10px]">{getInitials(displayName)}</div>
              <span className="hidden max-w-[160px] truncate text-xs font-bold text-slate-700 sm:block">{displayName}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-eco-700 transition ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>
            {showProfileMenu && (
              <div className="eco-popover absolute right-0 top-12 z-50 w-60 p-2">
                <div className="mb-1 rounded-xl bg-eco-50/70 px-3 py-2.5">
                  <p className="truncate text-xs font-bold text-slate-800">{account.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{account.email}</p>
                  <span className="eco-badge eco-badge-green mt-1.5">Approved organizer</span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </div>
            )}
          </div>
          </div>
        </header>

        <main key={activeTab} className="ecotask-page-enter eco-scroll flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-6">
              <h1 className="eco-page-title">{pageMeta[activeTab].title}</h1>
              <p className="eco-page-subtitle">{pageMeta[activeTab].subtitle}</p>
            </div>
            {activeTab === 'Dashboard' && <OrganizerHomeView goTo={setActiveTab} />}
            {activeTab === 'Create Activity' && <CreateActivityView />}
            {activeTab === 'Manage Activities' && (
              <ManageActivitiesView
                activeFilter={activityFilter}
                setFilter={setActivityFilter}
                openVolunteersFor={openVolunteersFor}
                onVolunteersOpened={() => setOpenVolunteersFor(null)}
              />
            )}
            {activeTab === 'Participation Record' && <ParticipationRecordView />}
            {activeTab === 'Reports' && <OrganizerReportsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ==========================================
   ORGANIZER HOME
   ========================================== */
// "in 3 days", "Tomorrow", "Today" for an activity date.
const getStartsIn = (dateValue) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = new Date(dateValue);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day - start) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return { days: 0, label: 'Today' };
  if (diff === 1) return { days: 1, label: 'Tomorrow' };
  return { days: diff, label: `in ${diff} days` };
};

// "2 hours ago", "Yesterday", "Oct 9"
const timeAgo = (value) => {
  const minutes = Math.round((Date.now() - new Date(value)) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function OrganizerHomeView({ goTo }) {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${getOrganizerInfo().token}` };
        const [statsResponse, activityResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/dashboard/organizer-stats`, { headers }),
          fetch(`${API_BASE_URL}/api/activities`, { headers }),
        ]);
        const statsData = await statsResponse.json();
        const activityData = await activityResponse.json();
        if (!statsResponse.ok) throw new Error(statsData.message || 'Unable to load statistics');
        setStats(statsData);
        if (activityResponse.ok) setActivities(sortActivitiesByStatus(activityData));
      } catch (requestError) {
        setError(requestError.message);
      }
    };
    load();
  }, []);

  const upcoming = activities.filter((activity) => getActivityStatus(activity.date) !== 'Completed').slice(0, 5);
  const attention = stats?.needsAttention || [];
  const feed = stats?.recentActivity || [];
  // Bars: how many volunteers joined each of the last 6 activities that have started.
  const chartActivities = activities.filter((a) => getActivityStatus(a.date) !== 'Upcoming').slice(-6);
  const chartMax = Math.max(1, ...chartActivities.map((a) => a.participants?.length || 0));

  const attentionRow = (item) => {
    const when = item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    if (item.type === 'finalize') {
      return {
        icon: UserCheck,
        text: item.title,
        detail: `ended ${when} · ${item.unmarked > 0 ? `${item.unmarked} volunteer${item.unmarked === 1 ? '' : 's'} not marked` : 'ready to finalize'}`,
        button: 'Finalize attendance',
        tab: 'Participation Record',
        primary: true,
      };
    }
    if (item.type === 'certificates') {
      return {
        icon: Award,
        text: item.title,
        detail: `${item.count} present volunteer${item.count === 1 ? '' : 's'} without a certificate yet`,
        button: 'Issue certificates',
        tab: 'Participation Record',
        primary: true,
      };
    }
    return {
      icon: Flag,
      text: `${item.count} open report${item.count === 1 ? '' : 's'} on ${item.title}`,
      detail: 'under admin review',
      button: 'View',
      tab: 'Reports',
      primary: false,
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      {stats && (attention.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 sm:px-5">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Needs your attention
            <span className="eco-badge eco-badge-amber">{attention.length}</span>
          </h3>
          <div className="mt-2 divide-y divide-amber-100">
            {attention.map((item) => {
              const row = attentionRow(item);
              const RowIcon = row.icon;
              return (
                <div key={`${item.type}-${item.activityId}`} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <RowIcon className="h-4 w-4" />
                  </span>
                  <p className="min-w-[180px] flex-1 text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
                    {row.text} <span className="text-xs font-medium text-amber-800/80">· {row.detail}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => goTo(row.tab)}
                    className={`eco-btn eco-btn-sm ${row.primary ? 'eco-btn-primary' : 'eco-btn-secondary'}`}
                  >
                    {row.button}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="flex items-center gap-2.5 rounded-2xl border border-eco-200 bg-eco-50/60 px-4 py-3 text-sm font-semibold text-eco-800">
          <CheckCircle2 className="h-4 w-4" /> You're all caught up. Nothing needs your attention.
        </section>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="My activities" value={stats?.totalActivities} icon={Calendar} hint={`${stats?.upcomingActivities ?? 0} upcoming`} />
        <StatTile
          label="Volunteers joined"
          value={stats?.totalVolunteersJoined}
          icon={Users}
          hint={stats?.joinedThisWeek > 0 ? `▲ ${stats.joinedThisWeek} this week` : 'No new sign-ups this week'}
        />
        <StatTile
          label="Attendance rate"
          value={stats?.attendanceRate == null ? '—' : `${stats.attendanceRate}%`}
          icon={UserCheck}
          hint={stats?.attendanceRate == null ? 'Shows after you finalize an activity' : `${stats.attendedFinal} of ${stats.decidedFinal} attended`}
        />
        <StatTile label="Certificates issued" value={stats?.certificatesIssued} icon={Award} hint={stats?.hiddenActivities ? `${stats.hiddenActivities} activity hidden by admin` : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="eco-card overflow-hidden">
            <CardTitle
              icon={CalendarClock}
              right={<button type="button" onClick={() => goTo('Manage Activities')} className="text-xs font-bold text-eco-700 hover:underline">View all →</button>}
            >
              Upcoming Activities
            </CardTitle>
            <div className="space-y-2.5 p-4">
              {upcoming.map((activity) => {
                const day = new Date(activity.date);
                const joined = activity.participants?.length || 0;
                const limit = activity.volunteerLimit || 1;
                const fill = Math.min(100, Math.round((joined / limit) * 100));
                const startsIn = getStartsIn(activity.date);
                const needsMore = fill < 40 && startsIn.days <= 14;
                return (
                  <div key={activity._id} className="flex items-center gap-3.5 rounded-2xl border border-eco-100 bg-white p-2.5 pr-4">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-eco-600 to-eco-700 text-white shadow-md">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-eco-100">{day.toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="text-xl font-extrabold leading-none">{day.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{activity.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{activity.location} · {startsIn.days === 0 ? 'happening today' : `starts ${startsIn.label}`}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${needsMore ? 'bg-amber-500' : 'bg-eco-600'}`} style={{ width: `${fill}%` }} />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`eco-badge ${needsMore ? 'eco-badge-amber' : 'eco-badge-green'}`}>
                        {joined} / {activity.volunteerLimit}{needsMore ? ' · needs more' : ''}
                      </span>
                      {activity.isHidden && <span className="eco-badge eco-badge-red">Hidden</span>}
                    </div>
                  </div>
                );
              })}
              {upcoming.length === 0 && (
                <div className="eco-empty">
                  <Calendar className="h-5 w-5 text-eco-400" />
                  No upcoming activities.
                  <button type="button" onClick={() => goTo('Create Activity')} className="eco-btn eco-btn-primary eco-btn-sm mt-1">Create one</button>
                </div>
              )}
            </div>
          </section>

          {chartActivities.length >= 2 && (
            <section className="eco-card overflow-hidden">
              <CardTitle icon={Users}>Volunteers per activity</CardTitle>
              <div className="flex items-end gap-4 px-6 pb-4 pt-5" style={{ height: 190 }}>
                {chartActivities.map((activity) => {
                  const count = activity.participants?.length || 0;
                  return (
                    <div key={activity._id} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center" title={`${activity.title}: ${count}`}>
                      <span className="mb-1 text-[11px] font-bold text-eco-800">{count}</span>
                      <div className="rounded-t-md bg-eco-500 transition-all" style={{ height: `${Math.max(6, (count / chartMax) * 100)}%`, minHeight: 6 }} />
                      <span className="mt-1.5 truncate text-[10px] font-semibold text-slate-500">{activity.title}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section className="eco-card overflow-hidden">
            <CardTitle icon={Activity}>Recent activity</CardTitle>
            <div className="px-4 py-2">
              {feed.map((event, index) => {
                const meta = event.type === 'join'
                  ? { icon: User, text: <><span className="font-bold">{event.name}</span> joined <span className="font-bold">{event.title}</span></> }
                  : event.type === 'certificates'
                    ? { icon: Award, text: <>{event.count} certificate{event.count === 1 ? '' : 's'} issued for <span className="font-bold">{event.title}</span></> }
                    : { icon: Flag, text: <>New report on <span className="font-bold">{event.title}</span></> };
                const FeedIcon = meta.icon;
                return (
                  <div key={`${event.type}-${event.at}-${index}`} className="flex gap-2.5 border-b border-eco-100/70 py-2.5 text-xs text-slate-700 last:border-b-0">
                    <span className="eco-icon-tile-soft h-7 w-7 shrink-0 rounded-full"><FeedIcon className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0">
                      <p className="leading-snug [overflow-wrap:anywhere]">{meta.text}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(event.at)}</p>
                    </div>
                  </div>
                );
              })}
              {feed.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">Nothing yet. New sign-ups and reports will show here.</p>
              )}
            </div>
          </section>

          <section className="eco-card overflow-hidden">
            <CardTitle icon={CheckCircle2}>Quick actions</CardTitle>
            <div className="space-y-2 p-4">
              {[
                { label: 'Create a new activity', tab: 'Create Activity', icon: PlusCircle },
                { label: 'Mark attendance & finalize', tab: 'Participation Record', icon: UserCheck },
                { label: 'Check reports', tab: 'Reports', icon: Flag },
              ].map(({ label, tab, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => goTo(tab)}
                  className="flex w-full items-center gap-3 rounded-xl border border-eco-100 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-eco-300 hover:bg-eco-50/60"
                >
                  <span className="eco-icon-tile-soft h-8 w-8 rounded-lg"><Icon className="h-4 w-4" /></span>
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ORGANIZER REPORTS (read-only; reporter identity is hidden)
   ========================================== */
function OrganizerReportsView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/organizer`, {
          headers: { Authorization: `Bearer ${getOrganizerInfo().token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load reports');
        setReports(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusBadge = {
    open: <span className="eco-badge eco-badge-amber">Under review</span>,
    dismissed: <span className="eco-badge eco-badge-gray">Dismissed</span>,
    actioned: <span className="eco-badge eco-badge-red">Activity hidden</span>,
  };

  if (loading) return <div className="eco-card mx-auto h-64 max-w-5xl animate-pulse bg-white/70" />;
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <p className="text-xs text-slate-500">
        Volunteers' names are kept private. If the admin hides an activity, the reason appears here and on the activity card.
      </p>
      {reports.map((report) => (
        <article key={report._id} className="eco-card flex flex-wrap items-start gap-4 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
            <Flag className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold text-slate-800">{report.activity?.title || 'Deleted activity'}</p>
              {statusBadge[report.status]}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-700">{report.reason}</p>
            {report.details && <p className="mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">"{report.details}"</p>}
            {report.adminNote && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="font-bold">Admin note:</span> {report.adminNote}</p>
            )}
            <p className="mt-2 text-[11px] text-slate-400">Reported {new Date(report.createdAt).toLocaleString()}</p>
          </div>
        </article>
      ))}
      {reports.length === 0 && (
        <div className="eco-empty py-12">
          <CheckCircle2 className="h-6 w-6 text-eco-400" />
          No reports about your activities. Nice work!
        </div>
      )}
    </div>
  );
}

/* ==========================================
   SHARED SMALL COMPONENTS
   ========================================== */
function StatTile({ label, value, icon: IconComponent, hint }) {
  return (
    <div className="eco-stat">
      <div className="flex items-start justify-between gap-3">
        <p className="eco-stat-label">{label}</p>
        <span className="eco-icon-tile h-9 w-9 rounded-xl">
          <IconComponent className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="eco-stat-value">{value ?? 0}</p>
      {hint && <p className="mt-2 text-[11px] font-medium text-slate-500">{hint}</p>}
    </div>
  );
}

function CardTitle({ icon: IconComponent, children, right }) {
  return (
    <div className="eco-card-header">
      <h3 className="eco-section-title">
        <span className="eco-icon-tile h-8 w-8 rounded-lg">
          <IconComponent className="h-[15px] w-[15px]" />
        </span>
        {children}
      </h3>
      {right}
    </div>
  );
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '?';
}

/* ==========================================
   CREATE ACTIVITY VIEW
   ========================================== */
/* ------------------------------------------
   Create Activity validation rules
   (kept in sync with backend validateActivityFields)
   ------------------------------------------ */
const ACTIVITY_LIMITS = {
  titleMin: 5,
  titleMax: 100,
  descriptionMin: 20,
  descriptionMax: 2000,
  placeMin: 3,
  placeMax: 200,
  volunteerMin: 1,
  volunteerMax: 1000,
  imageMaxBytes: 5 * 1024 * 1024,
};
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EMPTY_ACTIVITY_FORM = {
  title: '',
  volunteerLimit: '',
  description: '',
  date: '',
  time: '',
  location: '',
  meetingPlace: '',
  coverImage: '',
  coverImageFile: null,
};

const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const displayHour = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return { label: `${displayHour}:00 ${period}`, hour };
});

const toInputDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// opts (used by Edit): { originalDate, originalTime, minVolunteers }
const validateActivityField = (name, value, form, opts = {}) => {
  const text = typeof value === 'string' ? value.trim() : value;
  const L = ACTIVITY_LIMITS;

  switch (name) {
    case 'title':
      if (!text) return 'Title is required.';
      if (text.length < L.titleMin) return `Title must be at least ${L.titleMin} characters.`;
      if (text.length > L.titleMax) return `Title must be ${L.titleMax} characters or less.`;
      if (!/[a-zA-Z]/.test(text)) return 'Title must contain letters, not only numbers or symbols.';
      return '';

    case 'volunteerLimit': {
      if (text === '') return 'Volunteer limit is required.';
      if (!/^\d+$/.test(String(text))) return 'Use a whole number (no decimals or symbols).';
      const n = Number(text);
      if (n < L.volunteerMin) return `Volunteer limit must be at least ${L.volunteerMin}.`;
      if (n > L.volunteerMax) return `Volunteer limit can't be more than ${L.volunteerMax}.`;
      if (opts.minVolunteers && n < opts.minVolunteers) {
        return `Can't be lower than the ${opts.minVolunteers} volunteer(s) who already joined.`;
      }
      return '';
    }

    case 'description':
      if (!text) return 'Description is required.';
      if (text.length < L.descriptionMin) return `Please describe the activity in at least ${L.descriptionMin} characters.`;
      if (text.length > L.descriptionMax) return `Description must be ${L.descriptionMax} characters or less.`;
      return '';

    case 'date': {
      if (!text) return 'Date is required.';
      // Editing: keeping the original date is always allowed (even if it's already past)
      if (opts.originalDate && text === opts.originalDate) return '';
      const today = toInputDate(new Date());
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      if (text < today) return 'Date cannot be in the past.';
      if (text > toInputDate(oneYear)) return 'Date must be within one year from today.';
      return '';
    }

    case 'time': {
      if (!text) return 'Please select a time.';
      if (!TIME_OPTIONS.some((o) => o.label === text)) return 'Please pick a time from the list.';
      // Editing: an unchanged date + time is always allowed
      if (opts.originalDate && form.date === opts.originalDate && text === opts.originalTime) return '';
      // If the activity is today, the time must still be ahead
      if (form.date && form.date === toInputDate(new Date())) {
        const option = TIME_OPTIONS.find((o) => o.label === text);
        if (option && option.hour <= new Date().getHours()) return 'This time has already passed today.';
      }
      return '';
    }

    case 'location':
      if (!text) return 'Location is required.';
      if (text.length < L.placeMin) return `Location must be at least ${L.placeMin} characters.`;
      if (text.length > L.placeMax) return `Location must be ${L.placeMax} characters or less.`;
      return '';

    case 'meetingPlace':
      if (!text) return 'Meeting place is required.';
      if (text.length < L.placeMin) return `Meeting place must be at least ${L.placeMin} characters.`;
      if (text.length > L.placeMax) return `Meeting place must be ${L.placeMax} characters or less.`;
      return '';

    default:
      return '';
  }
};

const ACTIVITY_FIELDS = ['title', 'volunteerLimit', 'description', 'date', 'time', 'location', 'meetingPlace'];

const validateActivityForm = (form, opts = {}) => {
  const errors = {};
  ACTIVITY_FIELDS.forEach((field) => {
    const message = validateActivityField(field, form[field], form, opts);
    if (message) errors[field] = message;
  });
  return errors;
};

function Counter({ value, max }) {
  return (
    <span className={`text-[11px] font-medium ${value.length > max ? 'text-rose-600' : 'text-slate-400'}`}>
      {value.length}/{max}
    </span>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p>;
}

const inputState = (error) => (error ? 'border-rose-400 bg-rose-50/40 hover:border-rose-400 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgb(254_205_211/0.6)]' : '');

function CreateActivityView() {
  const [formData, setFormData] = useState(EMPTY_ACTIVITY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [imageError, setImageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);

  // Show an error only after the field was touched (or after pressing Publish)
  const shownError = (field) => (touched[field] ? errors[field] : '');

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'volunteerLimit') value = value.replace(/\D/g, '').slice(0, 4);

    const next = { ...formData, [name]: value };
    setFormData(next);
    setErrors((prevErrors) => {
      const updated = { ...prevErrors, [name]: validateActivityField(name, value, next) };
      // Changing the date can make the selected time valid/invalid
      if (name === 'date' && next.time) updated.time = validateActivityField('time', next.time, next);
      return updated;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateActivityField(name, formData[name], formData) }));
  };

  const blockNonDigits = (e) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault();
  };

  const handleClear = () => {
    setFormData(EMPTY_ACTIVITY_FORM);
    setErrors({});
    setTouched({});
    setImageError('');
    setNotification('');
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (file.size > ACTIVITY_LIMITS.imageMaxBytes) {
      setImageError('Image must be 5MB or smaller.');
      return;
    }

    setImageError('');
    setFormData((prev) => ({ ...prev, coverImage: URL.createObjectURL(file), coverImageFile: file }));
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, coverImage: '', coverImageFile: null }));
    setImageError('');
  };

  // Validate everything before opening the confirmation modal
  const requestPublish = () => {
    const allErrors = validateActivityForm(formData);
    setErrors(allErrors);
    setTouched(Object.fromEntries(ACTIVITY_FIELDS.map((f) => [f, true])));

    if (Object.keys(allErrors).length > 0 || imageError) {
      setNotification('Please fix the highlighted fields.');
      const first = ACTIVITY_FIELDS.find((f) => allErrors[f]);
      document.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setNotification('');
    setShowPublishConfirmation(true);
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      setNotification('');
      const organizerInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
      const body = new FormData();
      body.append('title', formData.title.trim());
      body.append('description', formData.description.trim());
      body.append('location', formData.location.trim());
      body.append('date', formData.date);
      body.append('time', formData.time);
      body.append('meetingPlace', formData.meetingPlace.trim());
      body.append('tasks', JSON.stringify([formData.time, formData.meetingPlace.trim()].filter(Boolean)));
      body.append('volunteerLimit', String(Number(formData.volunteerLimit)));
      if (formData.coverImageFile) body.append('coverImage', formData.coverImageFile);

      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${organizerInfo.token}` },
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        // Show backend field errors under the matching inputs
        if (data.errors) {
          setErrors((prev) => ({ ...prev, ...data.errors }));
          setTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(data.errors).map((f) => [f, true])) }));
        }
        throw new Error(data.message || 'Unable to publish activity');
      }

      setFormData(EMPTY_ACTIVITY_FORM);
      setErrors({});
      setTouched({});
      setNotification('Activity published successfully.');
    } catch (requestError) {
      setNotification(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmPublish = async () => {
    setShowPublishConfirmation(false);
    await handlePublish();
  };

  const isSuccess = notification === 'Activity published successfully.';
  const todayInput = toInputDate(new Date());
  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return toInputDate(d);
  })();
  const L = ACTIVITY_LIMITS;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 text-slate-800 xl:grid-cols-[1.25fr_1fr]">
      {/* FORM */}
      <div className="eco-card overflow-hidden">
        <CardTitle icon={PlusCircle}>New Activity</CardTitle>

        <div className="space-y-6 p-6">
          <p className="-mt-2 text-xs text-slate-500">All fields marked <span className="font-bold text-rose-600">*</span> are required.</p>

          <div>
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-eco-700">Activity details</h3>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="flex items-baseline justify-between">
                  <label className="eco-label">Title <span className="text-rose-600">*</span></label>
                  <Counter value={formData.title} max={L.titleMax} />
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={L.titleMax}
                  placeholder="e.g. Coastal Clean-up Drive"
                  className={`eco-input ${inputState(shownError('title'))}`}
                />
                <FieldError message={shownError('title')} />
              </div>
              <div>
                <label className="eco-label">Volunteer limit <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="volunteerLimit"
                  value={formData.volunteerLimit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={blockNonDigits}
                  placeholder={`${L.volunteerMin}–${L.volunteerMax}`}
                  className={`eco-input ${inputState(shownError('volunteerLimit'))}`}
                />
                <FieldError message={shownError('volunteerLimit')} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="eco-label">Description <span className="text-rose-600">*</span></label>
                <Counter value={formData.description} max={L.descriptionMax} />
              </div>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={L.descriptionMax}
                placeholder="What will volunteers do? What should they bring?"
                className={`eco-input resize-y ${inputState(shownError('description'))}`}
              />
              <FieldError message={shownError('description')} />
            </div>
          </div>

          <div className="border-t border-eco-100 pt-6">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-eco-700">Schedule & location</h3>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="eco-label">Date <span className="text-rose-600">*</span></label>
                <input
                  type="date"
                  name="date"
                  min={todayInput}
                  max={maxDate}
                  value={formData.date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`eco-input ${inputState(shownError('date'))}`}
                />
                <FieldError message={shownError('date')} />
              </div>
              <div>
                <label className="eco-label">Time <span className="text-rose-600">*</span></label>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`eco-input cursor-pointer ${inputState(shownError('time'))}`}
                >
                  <option value="">Select activity time</option>
                  {TIME_OPTIONS.map(({ label, hour }) => {
                    const passed = formData.date === todayInput && hour <= new Date().getHours();
                    return <option key={label} value={label} disabled={passed}>{label}{passed ? ' (passed)' : ''}</option>;
                  })}
                </select>
                <FieldError message={shownError('time')} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="eco-label">Location & landmark <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={L.placeMax}
                  placeholder="e.g. Lingayen Beach, Pangasinan"
                  className={`eco-input ${inputState(shownError('location'))}`}
                />
                <FieldError message={shownError('location')} />
              </div>
              <div>
                <label className="eco-label">Meeting place <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  name="meetingPlace"
                  value={formData.meetingPlace}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={L.placeMax}
                  placeholder="e.g. Baywalk Capitol Assembly Point"
                  className={`eco-input ${inputState(shownError('meetingPlace'))}`}
                />
                <FieldError message={shownError('meetingPlace')} />
              </div>
            </div>
          </div>

          <div className="border-t border-eco-100 pt-6">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-eco-700">Cover image <span className="font-semibold normal-case tracking-normal text-slate-400">(optional)</span></h3>
            <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-4 transition ${imageError ? 'border-rose-300 bg-rose-50/50' : 'border-eco-200 bg-eco-50/40 hover:border-eco-400 hover:bg-eco-50'}`}>
              <span className="eco-icon-tile-soft"><PlusCircle className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-700">
                  {formData.coverImage ? 'Change banner image' : 'Upload banner image'}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {formData.coverImageFile ? formData.coverImageFile.name : 'JPG, PNG or WEBP, up to 5MB'}
                </span>
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            </label>
            {formData.coverImage && (
              <button type="button" onClick={removeImage} className="mt-2 text-xs font-semibold text-rose-600 hover:underline">
                Remove image
              </button>
            )}
            <FieldError message={imageError} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-eco-100 bg-eco-50/40 px-6 py-4">
          {notification && (
            <p className={`mr-auto flex items-center gap-1.5 text-xs font-semibold ${isSuccess ? 'text-eco-700' : 'text-rose-600'}`}>
              {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {notification}
            </p>
          )}
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleClear} className="eco-btn eco-btn-danger-soft">
            Clear
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={requestPublish} disabled={saving} className="eco-btn eco-btn-primary px-5">
            {saving ? 'Publishing...' : 'Publish activity'}
          </button>
        </div>
      </div>

      {/* LIVE PREVIEW */}
      <div className="xl:sticky xl:top-0 xl:self-start">
        <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-eco-700">
          <span className="h-2 w-2 rounded-full bg-eco-500 shadow-[0_0_0_4px_rgba(102,187,106,0.25)]" />
          Volunteer view preview
        </p>
        <div className="eco-card overflow-hidden">
          <div className="relative h-48 overflow-hidden bg-eco-50">
            {formData.coverImage ? (
              <img src={formData.coverImage} alt="Activity preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-xs font-semibold text-eco-600/70">
                <Trees className="h-8 w-8" />
                Banner preview
              </div>
            )}
            {formData.coverImage && <div className="absolute inset-0 bg-gradient-to-t from-eco-950/50 via-transparent to-transparent" />}
            <button
              type="button"
              disabled
              className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-eco-700 shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="eco-badge eco-badge-blue absolute right-3 top-3">Upcoming</span>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-lg font-extrabold uppercase text-slate-800 [overflow-wrap:anywhere]">{formData.title || 'Activity title'}</h4>
              <span className="eco-badge eco-badge-green shrink-0">
                <User className="h-3 w-3" /> 0/{formData.volunteerLimit || 0}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-slate-600">
              <p className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-eco-600" /> <span className="truncate">{formData.location || 'Location'}</span></p>
              <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0 text-eco-600" /> {formData.date || 'Date'}</p>
              <p className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-eco-600" /> <span className="truncate">{formData.meetingPlace || 'Meeting place'}</span></p>
              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0 text-eco-600" /> {formData.time || 'Time'}</p>
            </div>

            <p className="mt-4 max-w-full rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-left text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
              {formData.description || 'Activity description will appear here.'}
            </p>

            <div className="mt-4 flex justify-end">
              <span className="eco-btn eco-btn-primary eco-btn-sm pointer-events-none opacity-90">REGISTER</span>
            </div>
          </div>
        </div>
      </div>

      {showPublishConfirmation && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="ecotask-modal-panel eco-modal w-full max-w-sm p-6 text-center text-slate-800">
            <span className="eco-icon-tile mx-auto h-12 w-12 rounded-2xl"><PlusCircle className="h-6 w-6" /></span>
            <h3 className="mt-4 text-base font-extrabold">Publish activity?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              This activity will become visible to volunteers after publishing.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowPublishConfirmation(false)}
                className="eco-btn eco-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPublish}
                className="eco-btn eco-btn-primary"
              >
                Publish activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   MANAGE ACTIVITIES VIEW
   ========================================== */
function ManageActivitiesView({ activeFilter, setFilter, openVolunteersFor, onVolunteersOpened }) {
  const [selectedActivityForVolunteers, setSelectedActivityForVolunteers] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [editingActivity, setEditingActivity] = useState(null);
  const [editOriginal, setEditOriginal] = useState(null); // snapshot to detect changes + edit rules
  const [editErrors, setEditErrors] = useState({});
  const [editTouched, setEditTouched] = useState({});
  const [editImageError, setEditImageError] = useState('');
  const [editNotice, setEditNotice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [listView, setListView] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const adminInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/activities`, {
          headers: { Authorization: `Bearer ${adminInfo.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load activities');
        setActivities(sortActivitiesByStatus(data));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const displayStatus = (activity) => getActivityStatus(activity.date);
  const getTime = (activity) => activity.tasks?.[0] || activity.time || 'Time not specified';
  const getMeeting = (activity) => activity.tasks?.[1] || activity.meeting || 'Meeting place not specified';
  // Two separate lists: activities still to come ("active") and finished ones ("past").
  const matchesSearch = (act) => `${act.title} ${act.location}`.toLowerCase().includes(searchTerm.toLowerCase());
  const activeActivities = activities.filter((act) => displayStatus(act) !== 'Completed');
  const pastActivities = activities.filter((act) => displayStatus(act) === 'Completed');
  const filtered = listView === 'past'
    ? sortLatestFirst(pastActivities.filter(matchesSearch))
    : sortActivitiesByStatus(activeActivities.filter((act) => (
      (activeFilter === 'All' || activeFilter === 'Completed' || displayStatus(act) === activeFilter) && matchesSearch(act)
    )));

  const statusCounts = activities.reduce((counts, activity) => {
    const status = displayStatus(activity);
    counts[status] += 1;
    return counts;
  }, { Upcoming: 0, Ongoing: 0, Completed: 0 });

  const loadParticipants = async (activity) => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
      const response = await fetch(`${API_BASE_URL}/api/activities/${activity._id}/participants`, {
        headers: { Authorization: `Bearer ${adminInfo.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load participants');
      setSelectedActivityForVolunteers({ ...activity, volunteerList: data.participants || [] });
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  // Opened from a "New volunteer joined" notification: show that activity's volunteers.
  useEffect(() => {
    if (!openVolunteersFor || loading) return;
    const target = activities.find((act) => String(act._id) === String(openVolunteersFor));
    if (target) loadParticipants(target);
    onVolunteersOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openVolunteersFor, loading, activities]);

  // Delete asks first in a confirmation card (deleteTarget = the activity waiting for an answer).
  const handleDelete = (activity) => {
    setDeleteError('');
    setDeleteTarget(activity);
  };

  const closeDeleteCard = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const adminInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
      const response = await fetch(`${API_BASE_URL}/api/activities/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminInfo.token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to delete activity');
      setActivities((current) => current.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (requestError) {
      setDeleteError(requestError.message === 'Failed to fetch'
        ? "Can't reach the server. Please try again."
        : requestError.message);
    } finally {
      setDeleting(false);
    }
  };

  // Escape closes the card.
  useEffect(() => {
    if (!deleteTarget) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeDeleteCard(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTarget, deleting]);

  // Placeholders like "Time not specified" must never end up in the form
  const cleanValue = (value, placeholder) => (value && value !== placeholder ? String(value) : '');

  const handleEdit = (activity) => {
    const form = {
      title: activity.title || '',
      volunteerLimit: activity.volunteerLimit ? String(activity.volunteerLimit) : '',
      description: activity.description || '',
      date: activity.date ? toInputDate(new Date(activity.date)) : '',
      time: cleanValue(activity.time || activity.tasks?.[0], 'Time not specified'),
      location: activity.location || '',
      meetingPlace: cleanValue(activity.meetingPlace || activity.tasks?.[1], 'Meeting place not specified'),
    };
    setEditingActivity({ ...form, _id: activity._id, coverImage: activity.coverImage || '', coverImageFile: null });
    setEditOriginal({
      ...form,
      participantCount: activity.participantCount ?? activity.participants?.length ?? 0,
    });
    setEditErrors({});
    setEditTouched({});
    setEditImageError('');
    setEditNotice('');
  };

  const closeEdit = () => {
    setEditingActivity(null);
    setEditOriginal(null);
  };

  const editRules = () => ({
    originalDate: editOriginal?.date,
    originalTime: editOriginal?.time,
    minVolunteers: editOriginal?.participantCount || 0,
  });

  const shownEditError = (field) => (editTouched[field] ? editErrors[field] : '');

  const handleEditChange = (event) => {
    const { name } = event.target;
    let { value } = event.target;
    if (name === 'volunteerLimit') value = value.replace(/\D/g, '').slice(0, 4);

    const next = { ...editingActivity, [name]: value };
    setEditingActivity(next);
    setEditNotice('');
    setEditErrors((prev) => {
      const updated = { ...prev, [name]: validateActivityField(name, value, next, editRules()) };
      if (name === 'date' && next.time) updated.time = validateActivityField('time', next.time, next, editRules());
      return updated;
    });
  };

  const handleEditBlur = (event) => {
    const { name } = event.target;
    setEditTouched((prev) => ({ ...prev, [name]: true }));
    setEditErrors((prev) => ({ ...prev, [name]: validateActivityField(name, editingActivity[name], editingActivity, editRules()) }));
  };

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setEditImageError('Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (file.size > ACTIVITY_LIMITS.imageMaxBytes) {
      setEditImageError('Image must be 5MB or smaller.');
      return;
    }
    setEditImageError('');
    setEditNotice('');
    setEditingActivity((current) => ({ ...current, coverImage: URL.createObjectURL(file), coverImageFile: file }));
  };

  const hasEditChanges = () => editingActivity && editOriginal && (
    !!editingActivity.coverImageFile
    || ACTIVITY_FIELDS.some((field) => String(editingActivity[field]).trim() !== String(editOriginal[field]).trim())
  );

  const saveEditedActivity = async (event) => {
    event.preventDefault();
    if (!editingActivity) return;

    const allErrors = validateActivityForm(editingActivity, editRules());
    setEditErrors(allErrors);
    setEditTouched(Object.fromEntries(ACTIVITY_FIELDS.map((f) => [f, true])));
    if (Object.keys(allErrors).length > 0 || editImageError) {
      setEditNotice('Please fix the highlighted fields.');
      const first = ACTIVITY_FIELDS.find((f) => allErrors[f]);
      document.querySelector(`form [name="${first}"]`)?.focus();
      return;
    }
    if (!hasEditChanges()) {
      setEditNotice('No changes to save.');
      return;
    }

    try {
      setSavingEdit(true);
      setEditNotice('');
      const organizerInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
      const meetingPlace = editingActivity.meetingPlace.trim();
      const body = new FormData();
      body.append('title', editingActivity.title.trim());
      body.append('description', editingActivity.description.trim());
      body.append('location', editingActivity.location.trim());
      body.append('meetingPlace', meetingPlace);
      body.append('time', editingActivity.time);
      body.append('tasks', JSON.stringify([editingActivity.time, meetingPlace].filter(Boolean)));
      body.append('date', editingActivity.date);
      body.append('volunteerLimit', String(Number(editingActivity.volunteerLimit)));
      if (editingActivity.coverImageFile) body.append('coverImage', editingActivity.coverImageFile);

      const response = await fetch(`${API_BASE_URL}/api/activities/${editingActivity._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${organizerInfo.token}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          setEditErrors((prev) => ({ ...prev, ...data.errors }));
          setEditTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(data.errors).map((f) => [f, true])) }));
        }
        throw new Error(data.message || 'Unable to update activity');
      }
      setActivities((current) => current.map((item) => item._id === data._id ? data : item));
      closeEdit();
    } catch (requestError) {
      setEditNotice(requestError.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <div key={item} className="eco-card h-80 animate-pulse bg-white/70" />)}
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>;

  const getActivityIcon = (category) => {
    switch (category) {
      case 'cleanup':
        return <Droplets className="h-4 w-4" />;
      case 'mangrove':
        return <Sprout className="h-4 w-4" />;
      default:
        return <Trees className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ongoing':
        return (
          <span className="eco-badge eco-badge-amber">
            <PlayCircle className="h-3 w-3 animate-pulse" />
            Ongoing
          </span>
        );
      case 'Upcoming':
        return (
          <span className="eco-badge eco-badge-blue">
            <Clock className="h-3 w-3" />
            Upcoming
          </span>
        );
      case 'Completed':
        return (
          <span className="eco-badge eco-badge-gray">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      default:
        return status;
    }
  };

  const actionBtn = 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition';

  return (
    <div className="relative mx-auto max-w-6xl space-y-5">
      <div className="eco-card flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex w-full items-center gap-2 rounded-xl border border-eco-100 bg-eco-50/50 px-3.5 py-2.5 text-slate-700 transition focus-within:border-eco-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-eco-200/40 sm:w-72">
          <Search className="h-4 w-4 text-eco-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search activities..."
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
          />
        </div>

        <div role="tablist" aria-label="Activity lists" className="inline-flex gap-1 rounded-2xl bg-eco-100/70 p-1">
          {[
            { key: 'active', label: 'Active', count: activeActivities.length },
            { key: 'past', label: 'Past events', count: pastActivities.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={listView === tab.key}
              onClick={() => setListView(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-extrabold transition ${
                listView === tab.key
                  ? tab.key === 'past' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-eco-800 shadow-sm'
                  : 'text-eco-700 hover:bg-white/60'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${listView === tab.key && tab.key === 'past' ? 'bg-white/20' : 'bg-black/5'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {listView === 'active' ? (
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All active', count: activeActivities.length, key: 'All', icon: Layers },
            { label: 'Upcoming', count: statusCounts.Upcoming, key: 'Upcoming', icon: CalendarClock },
            { label: 'Today', count: statusCounts.Ongoing, key: 'Ongoing', icon: Activity },
          ].map(({ label, count, key, icon: FilterIcon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`eco-chip ${activeFilter === key ? 'eco-chip-active' : ''}`}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              <span>{label}</span>
              <span className="eco-chip-count">{count}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5" /> Finished activities, most recent first. Check volunteers and issue certificates here.
        </p>
      )}

      {filtered.length === 0 && (
        <div className="eco-empty py-12">
          <FolderOpen className="h-6 w-6 text-eco-400" />
          {listView === 'past' && !searchTerm ? 'No past events yet.' : 'No activities match your search or filter.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {filtered.map((act, index) => {
          const status = displayStatus(act);
          const joinedCount = act.participants?.length || 0;
          const limit = Number(act.volunteerLimit) || 0;
          const fillPercent = limit > 0 ? Math.min(100, Math.round((joinedCount / limit) * 100)) : 0;
          const category = act.title.toLowerCase().includes('clean') ? 'cleanup' : act.title.toLowerCase().includes('mangrove') ? 'mangrove' : 'tree-planting';
          return (
            <article
              key={act._id}
              style={{ '--ecotask-delay': `${(index % 6) * 60}ms` }}
              className="ecotask-card-enter eco-card eco-card-hover group flex flex-col overflow-hidden text-slate-800"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-eco-100 to-eco-50">
                {act.coverImage ? (
                  <img src={getActivityImageUrl(act.coverImage)} alt={act.title} className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${status === 'Completed' ? 'grayscale' : ''}`} />
                ) : (
                  <div className="flex h-full items-center justify-center text-eco-300">
                    <Trees className="h-14 w-14" strokeWidth={1.2} />
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${act.coverImage ? 'from-eco-950/55' : 'from-eco-700/35'} via-transparent to-transparent`} />
                <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
                  {getStatusBadge(status)}
                  {act.isHidden && (
                    <span className="eco-badge eco-badge-red"><EyeOff className="h-3 w-3" /> Hidden by admin</span>
                  )}
                  {act.openReports > 0 && (
                    <span className="eco-badge eco-badge-amber"><Flag className="h-3 w-3" /> {act.openReports} report{act.openReports === 1 ? '' : 's'}</span>
                  )}
                </div>
                <p className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow">
                  <Calendar className="h-3.5 w-3.5" /> {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  <span className="opacity-60">•</span>
                  <Clock className="h-3.5 w-3.5" /> {getTime(act)}
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <h4 className="flex items-start gap-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-800">
                  <span className="eco-icon-tile-soft h-8 w-8 rounded-lg">{getActivityIcon(category)}</span>
                  <span className="pt-1.5 [overflow-wrap:anywhere]">{act.title}</span>
                </h4>

                <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{act.description || 'No description provided.'}</p>

                {act.isHidden && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    <span className="font-bold">Hidden from volunteers by the admin:</span> {act.hiddenReason || 'No reason given.'}
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2 font-semibold text-slate-700">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-eco-600" />
                    <span className="truncate">{act.location}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0 text-eco-600" />
                    <span className="truncate">Meeting: {getMeeting(act)}</span>
                  </p>
                </div>

                <div className="mt-auto">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>{joinedCount}/{act.volunteerLimit} volunteers joined</span>
                    <span className="text-eco-700">{fillPercent}%</span>
                  </div>
                  <div className="eco-progress"><span style={{ width: `${fillPercent}%` }} /></div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1 border-t border-eco-100 bg-eco-50/40 px-4 py-2.5 text-slate-600">
                {status !== 'Completed' && (
                  <button onClick={() => handleEdit(act)} className={`${actionBtn} hover:bg-eco-100 hover:text-eco-800`}>
                    <Edit3 className="h-3.5 w-3.5 text-eco-600" /> Edit
                  </button>
                )}
                <button onClick={() => loadParticipants(act)} className={`${actionBtn} hover:bg-eco-100 hover:text-eco-800`}>
                  <Users className="h-3.5 w-3.5 text-eco-600" /> Volunteers
                </button>
                <button onClick={() => handleDelete(act)} className={`${actionBtn} text-rose-600 hover:bg-rose-50`}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {editingActivity && (() => {
        const today = toInputDate(new Date());
        const maxDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return toInputDate(d); })();
        const L = ACTIVITY_LIMITS;
        const legacyTime = editingActivity.time && !TIME_OPTIONS.some((o) => o.label === editingActivity.time);
        const minVolunteers = editOriginal?.participantCount || 0;
        const isPastOriginal = editOriginal?.date && editOriginal.date < today;
        const noticeIsInfo = editNotice === 'No changes to save.';
        const field = (name) => ({
          name,
          value: editingActivity[name],
          onChange: handleEditChange,
          onBlur: handleEditBlur,
          className: `eco-input mt-1.5 ${inputState(shownEditError(name))}`,
        });
        const Req = () => <span className="text-rose-600">*</span>;

        return (
          <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
            <div className="absolute inset-0" onClick={closeEdit} />
            <form onSubmit={saveEditedActivity} noValidate className="ecotask-modal-panel eco-modal eco-scroll relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
              <div className="eco-card-header sticky top-0 z-10 bg-white/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="eco-icon-tile h-9 w-9 rounded-xl"><Edit3 className="h-4 w-4" /></span>
                  <div>
                    <h3 className="text-base font-extrabold">Edit Activity</h3>
                    <p className="text-xs text-slate-500">Fields marked <span className="font-bold text-rose-600">*</span> are required.</p>
                  </div>
                </div>
                <button type="button" onClick={closeEdit} aria-label="Close" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-baseline justify-between">
                    <label className="eco-label mb-0">Title <Req /></label>
                    <Counter value={editingActivity.title} max={L.titleMax} />
                  </div>
                  <input type="text" maxLength={L.titleMax} {...field('title')} />
                  <FieldError message={shownEditError('title')} />
                </div>

                <div>
                  <label className="eco-label mb-0">Volunteer limit <Req /></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={`${Math.max(L.volunteerMin, minVolunteers)}–${L.volunteerMax}`}
                    onKeyDown={(e) => { if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault(); }}
                    {...field('volunteerLimit')}
                  />
                  {minVolunteers > 0 && !shownEditError('volunteerLimit') && (
                    <p className="mt-1 text-[11px] text-slate-500">{minVolunteers} volunteer(s) already joined — can't go lower.</p>
                  )}
                  <FieldError message={shownEditError('volunteerLimit')} />
                </div>

                <div>
                  <label className="eco-label mb-0">Date <Req /></label>
                  <input
                    type="date"
                    min={isPastOriginal ? undefined : today}
                    max={maxDate}
                    {...field('date')}
                  />
                  {isPastOriginal && !shownEditError('date') && (
                    <p className="mt-1 text-[11px] text-slate-500">This activity already happened. A new date must be today or later.</p>
                  )}
                  <FieldError message={shownEditError('date')} />
                </div>

                <div>
                  <label className="eco-label mb-0">Time <Req /></label>
                  <select {...field('time')} className={`${field('time').className} cursor-pointer`}>
                    <option value="">Select activity time</option>
                    {legacyTime && <option value={editingActivity.time} disabled>{editingActivity.time} (old format)</option>}
                    {TIME_OPTIONS.map(({ label, hour }) => {
                      const keepsOriginal = editingActivity.date === editOriginal?.date && label === editOriginal?.time;
                      const passed = editingActivity.date === today && hour <= new Date().getHours() && !keepsOriginal;
                      return <option key={label} value={label} disabled={passed}>{label}{passed ? ' (passed)' : ''}</option>;
                    })}
                  </select>
                  <FieldError message={shownEditError('time')} />
                </div>

                <div>
                  <label className="eco-label mb-0">Location & landmark <Req /></label>
                  <input type="text" maxLength={L.placeMax} {...field('location')} />
                  <FieldError message={shownEditError('location')} />
                </div>

                <div>
                  <label className="eco-label mb-0">Meeting place <Req /></label>
                  <input type="text" maxLength={L.placeMax} {...field('meetingPlace')} />
                  <FieldError message={shownEditError('meetingPlace')} />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-baseline justify-between">
                    <label className="eco-label mb-0">Description <Req /></label>
                    <Counter value={editingActivity.description} max={L.descriptionMax} />
                  </div>
                  <textarea rows={4} maxLength={L.descriptionMax} {...field('description')} className={`${field('description').className} resize-y`} />
                  <FieldError message={shownEditError('description')} />
                </div>

                <div className="sm:col-span-2">
                  <label className="eco-label mb-0">Cover image / banner <span className="font-medium text-slate-400">(optional)</span></label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleEditImageChange}
                    className={`mt-1.5 block w-full rounded-xl border border-dashed p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-eco-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white ${editImageError ? 'border-rose-300 bg-rose-50/50' : 'border-eco-200 bg-eco-50/40'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">JPG, PNG or WEBP, up to 5MB. Leave empty to keep the current image.</p>
                  <FieldError message={editImageError} />
                </div>
                {editingActivity.coverImage && <img src={getActivityImageUrl(editingActivity.coverImage)} alt="Activity preview" className="h-40 w-full rounded-xl object-cover sm:col-span-2" />}
              </div>

              <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-eco-100 bg-eco-50/95 px-6 py-4 backdrop-blur">
                {editNotice && (
                  <p className={`mr-auto flex items-center gap-1.5 text-xs font-semibold ${noticeIsInfo ? 'text-slate-500' : 'text-rose-600'}`}>
                    {!noticeIsInfo && <X className="h-4 w-4" />}
                    {editNotice}
                  </p>
                )}
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closeEdit} className="eco-btn eco-btn-secondary">Cancel</button>
                <button type="submit" onMouseDown={(e) => e.preventDefault()} disabled={savingEdit} className="eco-btn eco-btn-primary">{savingEdit ? 'Saving...' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        );
      })()}

      {deleteTarget && (() => {
        const joinedCount = deleteTarget.participantCount ?? deleteTarget.participants?.length ?? 0;
        return (
          <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
            <div className="absolute inset-0" onClick={closeDeleteCard} />
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-activity-title"
              className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-md overflow-hidden"
            >
              <div className="px-6 pb-2 pt-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
                  <Trash2 className="h-6 w-6" />
                </span>
                <h3 id="delete-activity-title" className="mt-4 text-lg font-extrabold text-slate-800">
                  Delete this activity?
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-700 [overflow-wrap:anywhere]">{deleteTarget.title}</p>
              </div>

              <div className="space-y-3 px-6 py-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800">
                  <p className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" /> This can't be undone.
                  </p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                    <li>The activity, its attendance records and reports will be removed.</li>
                    {joinedCount > 0 ? (
                      <li>
                        <span className="font-bold">{joinedCount} volunteer{joinedCount === 1 ? '' : 's'}</span> who joined will be notified that it was cancelled.
                      </li>
                    ) : (
                      <li>No volunteers have joined yet.</li>
                    )}
                  </ul>
                </div>

                {deleteError && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {deleteError}
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
                <button type="button" onClick={closeDeleteCard} disabled={deleting} className="eco-btn eco-btn-muted flex-1">
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete} disabled={deleting} className="eco-btn eco-btn-danger flex-1">
                  <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete activity'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedActivityForVolunteers && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedActivityForVolunteers(null)}
          />
          <div className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-xl overflow-hidden">
            <div className="eco-card-header">
              <div className="flex min-w-0 items-center gap-3">
                <span className="eco-icon-tile h-9 w-9 rounded-xl"><Users className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800">
                    Volunteers Joined
                    <span className="eco-badge eco-badge-green ml-2 align-middle">{selectedActivityForVolunteers.volunteerList?.length || 0}</span>
                  </h3>
                  <p className="truncate text-xs font-medium text-slate-500">
                    {selectedActivityForVolunteers.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivityForVolunteers(null)}
                aria-label="Close"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="eco-scroll max-h-72 overflow-y-auto p-4">
              <table className="eco-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedActivityForVolunteers.volunteerList &&
                  selectedActivityForVolunteers.volunteerList.length > 0 ? (
                    selectedActivityForVolunteers.volunteerList.map((vol, i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="eco-avatar h-7 w-7 text-[10px]">{getInitials(vol.name)}</span>
                            <span className="font-bold text-slate-800">{vol.name}</span>
                          </div>
                        </td>
                        <td className="text-slate-500">{vol.email || 'Not provided'}</td>
                        <td className="text-slate-500">{vol.phone || 'Not provided'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        No volunteers joined yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-eco-100 px-5 py-3">
              <button
                onClick={() => setSelectedActivityForVolunteers(null)}
                className="eco-btn eco-btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   PARTICIPATION RECORD
   Left: activity list with filters. Right: attendance for the chosen activity.
   ========================================== */
const LIST_FILTERS = ['All', 'Needs attendance', 'Today', 'Upcoming', 'Completed'];

// Attendance totals sent by the backend; falls back to the joined count for older backends.
const getAttendanceSummary = (activity) => activity.attendance || {
  total: activity.participants?.length || 0,
  present: 0,
  absent: 0,
  unmarked: null,
};

const summarizeParticipants = (records) => {
  const count = (value) => records.filter((p) => p.attendance === value).length;
  const present = count('present');
  const absent = count('absent');
  return { total: records.length, present, absent, unmarked: records.length - present - absent };
};

// Today's activities first, then upcoming (soonest first), then completed (newest first).
const sortForAttendance = (activities) => {
  const rank = { Ongoing: 0, Upcoming: 1, Completed: 2 };
  return [...activities].sort((a, b) => {
    const statusA = getActivityStatus(a.date);
    const statusB = getActivityStatus(b.date);
    if (statusA !== statusB) return rank[statusA] - rank[statusB];
    const diff = new Date(a.date) - new Date(b.date);
    return statusA === 'Completed' ? -diff : diff;
  });
};

const needsAttendance = (activity) => {
  const status = getActivityStatus(activity.date);
  const { unmarked } = getAttendanceSummary(activity);
  return status !== 'Upcoming' && unmarked > 0;
};

// Open on the most useful activity: today's, then the latest completed one with
// unmarked volunteers, then the next upcoming one, then whatever is first.
const pickDefaultActivity = (sorted) => (
  sorted.find((a) => getActivityStatus(a.date) === 'Ongoing')
  || sorted.find(needsAttendance)
  || sorted.find((a) => getActivityStatus(a.date) === 'Upcoming')
  || sorted[0]
);

const STATUS_BADGE = {
  Ongoing: { label: 'Today', className: 'eco-badge-amber' },
  Upcoming: { label: 'Upcoming', className: 'eco-badge-blue' },
  Completed: { label: 'Completed', className: 'eco-badge-green' },
};

function ParticipationRecordView() {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [listFilter, setListFilter] = useState('All');
  const [listSearch, setListSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  // Finalize card: open = waiting for an answer, result = outcome shown in the same card.
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeResult, setFinalizeResult] = useState(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const organizerInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/activities`, {
          headers: { Authorization: `Bearer ${organizerInfo.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load activities');
        const sorted = sortForAttendance(data);
        setActivities(sorted);
        setSelectedActivity(pickDefaultActivity(sorted)?._id || '');
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  useEffect(() => {
    if (!selectedActivity) return;
    let cancelled = false;

    const loadParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const organizerInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/participation/activity/${selectedActivity}`, {
          headers: { Authorization: `Bearer ${organizerInfo.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load participation records');
        if (cancelled) return;
        setParticipants(data);
        // Keep the list's progress in sync with the real records.
        setActivities((current) => current.map((a) => (
          a._id === selectedActivity ? { ...a, attendance: summarizeParticipants(data) } : a
        )));
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoadingParticipants(false);
      }
    };

    setSearchTerm('');
    loadParticipants();
    return () => { cancelled = true; };
  }, [selectedActivity]);

  const handleAttendanceChange = async (id, newStatus) => {
    try {
      const organizerInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
      const response = await fetch(`${API_BASE_URL}/api/participation/${id}/attendance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerInfo.token}`,
        },
        body: JSON.stringify({ attendance: newStatus.toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update attendance');
      const updated = participants.map((participant) => (participant._id === id ? data : participant));
      setParticipants(updated);
      setActivities((current) => current.map((a) => (
        a._id === selectedActivity ? { ...a, attendance: summarizeParticipants(updated) } : a
      )));
      setActionError('');
    } catch (requestError) {
      setActionError(requestError.message);
    }
  };

  // Marks every volunteer who is still unmarked as present.
  const markAllPresent = async () => {
    const unmarked = participants.filter((p) => !p.attendance);
    if (unmarked.length === 0) return;
    try {
      const organizerInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
      const results = await Promise.all(unmarked.map(async (p) => {
        const response = await fetch(`${API_BASE_URL}/api/participation/${p._id}/attendance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerInfo.token}` },
          body: JSON.stringify({ attendance: 'present' }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to update attendance');
        return data;
      }));
      const byId = new Map(results.map((record) => [record._id, record]));
      const updated = participants.map((p) => byId.get(p._id) || p);
      setParticipants(updated);
      setActivities((current) => current.map((a) => (
        a._id === selectedActivity ? { ...a, attendance: summarizeParticipants(updated) } : a
      )));
      setActionError('');
    } catch (requestError) {
      setActionError(requestError.message);
    }
  };

  const closeFinalizeCard = () => {
    if (finalizing) return;
    setFinalizeOpen(false);
    setFinalizeResult(null);
  };

  const finalizeAttendance = async () => {
    if (finalizing) return;
    setFinalizing(true);
    setFinalizeResult(null);
    try {
      const organizerInfo = JSON.parse(localStorage.getItem('organizerInfo') || '{}');
      const response = await fetch(`${API_BASE_URL}/api/participation/activity/${selectedActivity}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${organizerInfo.token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to finalize attendance');
      const updated = participants.map((p) => {
        const attendance = p.attendance || 'absent';
        return { ...p, attendance, certificateIssued: attendance === 'present' ? true : p.certificateIssued };
      });
      setParticipants(updated);
      setActivities((current) => current.map((a) => (
        a._id === selectedActivity ? { ...a, attendanceFinalized: true, attendance: summarizeParticipants(updated) } : a
      )));
      setFinalizeResult({ type: 'success', message: data.message || 'Attendance finalized.' });
    } catch (requestError) {
      setFinalizeResult({
        type: 'error',
        message: requestError.message === 'Failed to fetch'
          ? "Can't reach the server. Please try again."
          : requestError.message,
      });
    } finally {
      setFinalizing(false);
    }
  };

  // Escape closes the finalize card.
  useEffect(() => {
    if (!finalizeOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeFinalizeCard(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizeOpen, finalizing]);

  if (loading) return <div className="eco-card mx-auto h-96 max-w-6xl animate-pulse bg-white/70" />;
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>;

  if (activities.length === 0) {
    return (
      <div className="eco-card mx-auto max-w-6xl">
        <div className="eco-empty py-16">
          <BookOpen className="h-6 w-6 text-eco-400" />
          You haven't created any activities yet. Attendance will show up here once volunteers join.
        </div>
      </div>
    );
  }

  const filterCounts = {
    All: activities.length,
    'Needs attendance': activities.filter(needsAttendance).length,
    Today: activities.filter((a) => getActivityStatus(a.date) === 'Ongoing').length,
    Upcoming: activities.filter((a) => getActivityStatus(a.date) === 'Upcoming').length,
    Completed: activities.filter((a) => getActivityStatus(a.date) === 'Completed').length,
  };

  const listQuery = listSearch.trim().toLowerCase();
  const visibleActivities = activities.filter((a) => {
    const status = getActivityStatus(a.date);
    const matchesFilter = listFilter === 'All'
      || (listFilter === 'Needs attendance' && needsAttendance(a))
      || (listFilter === 'Today' && status === 'Ongoing')
      || listFilter === status;
    return matchesFilter && `${a.title} ${a.location}`.toLowerCase().includes(listQuery);
  });

  const filteredParticipants = participants.filter((p) =>
    (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = summarizeParticipants(participants);
  const attended = totals.present;
  const attendanceRate = totals.total > 0 ? Math.round((attended / totals.total) * 100) : 0;
  const activeActivity = activities.find((activity) => activity._id === selectedActivity);
  const activeStatus = activeActivity ? getActivityStatus(activeActivity.date) : null;
  const isFinalized = Boolean(activeActivity?.attendanceFinalized);
  const newCertificates = participants.filter((p) => p.attendance === 'present' && !p.certificateIssued).length;
  const canFinalize = activeStatus !== 'Upcoming'
    && totals.total > 0
    && totals.unmarked === 0
    && (!isFinalized || newCertificates > 0);
  const stepsDone = activeStatus === 'Upcoming' ? 0 : (isFinalized && newCertificates === 0 ? 3 : 1);

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-800">
      {/* Overview Stat Cards (for the selected activity) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Registered" value={totals.total} icon={Users} />
        <StatTile label="Attended" value={attended} icon={UserCheck} hint={`${attendanceRate}% rate`} />
        <StatTile label="Absent" value={totals.absent} icon={UserX} />
        <StatTile label="Not marked" value={totals.unmarked} icon={Hourglass} hint={totals.unmarked > 0 && activeStatus !== 'Upcoming' ? 'Mark these volunteers' : undefined} />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Activity list */}
        <div className="eco-card overflow-hidden lg:sticky lg:top-0 lg:col-span-4">
          <div className="space-y-3 border-b border-eco-100 p-4">
            <h3 className="eco-section-title">
              <span className="eco-icon-tile h-8 w-8 rounded-lg"><FolderOpen className="h-[15px] w-[15px]" /></span>
              My Activities
            </h3>
            <div className="flex items-center gap-2 rounded-xl border border-eco-100 bg-eco-50/50 px-3 py-2">
              <Search className="h-4 w-4 text-eco-600" />
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search activities..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIST_FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setListFilter(key)}
                  className={`eco-chip px-2.5 py-1 text-[11px] ${listFilter === key ? 'eco-chip-active' : ''}`}
                >
                  {key}
                  <span className={`ml-1 rounded-full px-1.5 text-[10px] ${key === 'Needs attendance' && filterCounts[key] > 0 && listFilter !== key ? 'bg-amber-100 text-amber-800' : 'opacity-70'}`}>
                    {filterCounts[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <ul className="eco-scroll max-h-72 divide-y divide-eco-100 overflow-y-auto lg:max-h-[560px]">
            {visibleActivities.map((activity) => {
              const status = getActivityStatus(activity.date);
              const badge = STATUS_BADGE[status];
              const summary = getAttendanceSummary(activity);
              const marked = summary.unmarked === null ? null : summary.total - summary.unmarked;
              const progress = summary.total > 0 && marked !== null ? Math.round((marked / summary.total) * 100) : 0;
              const isSelected = activity._id === selectedActivity;
              return (
                <li key={activity._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(activity._id)}
                    className={`relative w-full px-4 py-3 text-left transition ${isSelected ? 'bg-eco-50' : 'hover:bg-eco-50/50'}`}
                  >
                    {isSelected && <span className="absolute inset-y-0 left-0 w-1 bg-eco-600" />}
                    <div className="flex items-start justify-between gap-2">
                      <p className={`min-w-0 truncate text-sm font-bold ${isSelected ? 'text-eco-800' : 'text-slate-800'}`}>{activity.title}</p>
                      <span className={`eco-badge ${badge.className} shrink-0`}>{badge.label}</span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(activity.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{summary.total} / {activity.volunteerLimit}</span>
                    </p>
                    {activity.attendanceFinalized && (
                      <span className="eco-badge eco-badge-green mt-2"><CheckCircle2 className="h-3 w-3" /> Finalized</span>
                    )}
                    {!activity.attendanceFinalized && summary.total > 0 && marked !== null && status !== 'Upcoming' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-eco-600' : 'bg-amber-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${progress === 100 ? 'text-eco-700' : 'text-amber-700'}`}>
                          {marked} of {summary.total} marked
                        </span>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
            {visibleActivities.length === 0 && (
              <li className="px-4 py-10 text-center text-xs text-slate-400">
                {listFilter === 'Needs attendance' && !listQuery ? 'All caught up! Every volunteer is marked.' : 'No activities match.'}
              </li>
            )}
          </ul>
        </div>

        {/* Participants table */}
        <div className="eco-card overflow-hidden lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-eco-100 bg-gradient-to-r from-eco-50/80 to-white p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800 [overflow-wrap:anywhere]">{activeActivity?.title}</h3>
                {activeStatus && <span className={`eco-badge ${STATUS_BADGE[activeStatus].className}`}>{STATUS_BADGE[activeStatus].label}</span>}
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-eco-600" /> {activeActivity?.date ? new Date(activeActivity.date).toLocaleDateString() : '-'}{activeActivity?.time ? ` · ${activeActivity.time}` : ''}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-eco-600" /> {activeActivity?.location || '-'}</span>
              </p>
            </div>

            <div className="flex w-full items-center gap-2 rounded-xl border border-eco-100 bg-white px-3.5 py-2.5 text-slate-700 transition focus-within:border-eco-400 focus-within:ring-4 focus-within:ring-eco-200/40 sm:w-64">
              <Search className="h-4 w-4 text-eco-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search participants..."
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {activeStatus !== 'Upcoming' && participants.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-eco-100 bg-eco-50/40 px-5 py-3 text-xs font-bold">
              {[
                { n: 1, label: 'Activity ended', done: true },
                { n: 2, label: 'Mark attendance', done: totals.unmarked === 0 },
                { n: 3, label: 'Finalize & issue certificates', done: stepsDone === 3 },
              ].map((step, index, all) => {
                const current = !step.done && all.slice(0, index).every((previous) => previous.done);
                return (
                  <span key={step.n} className="flex items-center gap-2">
                    {index > 0 && <span className="h-0.5 w-6 rounded bg-eco-200" />}
                    <span className={`flex items-center gap-1.5 ${step.done || current ? 'text-eco-800' : 'text-slate-400'}`}>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step.done ? 'bg-eco-600 text-white' : current ? 'bg-eco-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {step.done ? '✓' : step.n}
                      </span>
                      {step.label}
                    </span>
                  </span>
                );
              })}
              <span className={`eco-badge ml-auto ${isFinalized ? 'eco-badge-green' : 'eco-badge-amber'}`}>
                {isFinalized ? 'Finalized' : 'Draft · volunteers see "Pending"'}
              </span>
            </div>
          )}

          {actionError && (
            <p role="alert" className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {actionError}
            </p>
          )}

          {activeStatus === 'Upcoming' && participants.length > 0 && (
            <p className="mx-5 mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-semibold text-sky-800">
              This activity hasn't happened yet. You can mark attendance on the day.
            </p>
          )}

          <div className="eco-scroll overflow-x-auto p-3">
            <table className="eco-table min-w-[560px]">
              <thead>
                <tr>
                  <th>Registered Participant</th>
                  <th>Date Joined</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {loadingParticipants && participants.length === 0 ? (
                  <tr><td colSpan={3} className="py-10"><div className="mx-auto h-4 w-40 animate-pulse rounded bg-slate-200" /></td></tr>
                ) : filteredParticipants.length > 0 ? (
                  filteredParticipants.map((p) => (
                    <tr key={p._id} className={loadingParticipants ? 'opacity-50' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="eco-avatar h-8 w-8 text-[11px]">{getInitials(p.user?.name)}</span>
                          <span className="font-bold text-slate-800">{p.user?.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{p.joinedAt ? new Date(p.joinedAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="inline-flex overflow-hidden rounded-xl border border-eco-200 bg-white text-xs font-bold">
                          {[
                            { value: 'present', label: 'Present', active: 'bg-eco-600 text-white' },
                            { value: 'absent', label: 'Absent', active: 'bg-rose-600 text-white' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              disabled={activeStatus === 'Upcoming'}
                              onClick={() => p.attendance !== option.value && handleAttendanceChange(p._id, option.value)}
                              className={`px-3.5 py-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                p.attendance === option.value ? option.active : 'text-slate-500 hover:bg-eco-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        {!p.attendance && <span className="eco-badge eco-badge-amber ml-2">Not marked</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-slate-400">
                      {participants.length === 0 ? 'No volunteers have joined this activity yet.' : 'No participants found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {activeStatus !== 'Upcoming' && participants.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-eco-100 bg-eco-50/40 px-5 py-4">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-800">{totals.present} present</span> · {totals.absent} absent ·{' '}
                <span className={`font-bold ${totals.unmarked > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{totals.unmarked} not marked</span>
                <br />Marks save automatically.
              </p>
              <div className="flex flex-wrap gap-2">
                {totals.unmarked > 0 && (
                  <button type="button" onClick={markAllPresent} className="eco-btn eco-btn-secondary">
                    <UserCheck className="h-4 w-4" /> Mark all present
                  </button>
                )}
                <button
                  type="button"
                  disabled={!canFinalize}
                  onClick={() => { setFinalizeResult(null); setFinalizeOpen(true); }}
                  className="eco-btn eco-btn-primary"
                >
                  <Award className="h-4 w-4" />
                  {isFinalized
                    ? (newCertificates > 0 ? `Issue ${newCertificates} new certificate${newCertificates === 1 ? '' : 's'}` : 'Finalized')
                    : 'Finalize & issue certificates'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {finalizeOpen && (() => {
        const done = finalizeResult?.type === 'success';
        return (
          <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
            <div className="absolute inset-0" onClick={closeFinalizeCard} />
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="finalize-attendance-title"
              className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-md overflow-hidden"
            >
              <div className="px-6 pb-2 pt-6 text-center">
                <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${done ? 'border-eco-200 bg-eco-50 text-eco-700' : 'border-amber-200 bg-amber-50 text-amber-600'}`}>
                  {done ? <CheckCircle2 className="h-6 w-6" /> : <Award className="h-6 w-6" />}
                </span>
                <h3 id="finalize-attendance-title" className="mt-4 text-lg font-extrabold text-slate-800">
                  {done ? 'Attendance finalized' : isFinalized ? 'Issue new certificates?' : 'Finalize attendance?'}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-700 [overflow-wrap:anywhere]">{activeActivity?.title}</p>
              </div>

              <div className="space-y-3 px-6 py-4">
                {done ? (
                  <div className="rounded-xl border border-eco-200 bg-eco-50 p-3 text-center text-xs font-semibold leading-relaxed text-eco-800">
                    {finalizeResult.message}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    <p className="font-bold">This will:</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                      <li>Issue certificates to <span className="font-bold">{newCertificates} present volunteer{newCertificates === 1 ? '' : 's'}</span></li>
                      {!isFinalized && <li>Show final attendance to all volunteers</li>}
                    </ul>
                    <p className="mt-2">You can still edit marks later and issue certificates to anyone newly marked present.</p>
                  </div>
                )}

                {finalizeResult?.type === 'error' && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {finalizeResult.message}
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
                {done ? (
                  <button type="button" onClick={closeFinalizeCard} className="eco-btn eco-btn-primary flex-1">Done</button>
                ) : (
                  <>
                    <button type="button" onClick={closeFinalizeCard} disabled={finalizing} className="eco-btn eco-btn-muted flex-1">Cancel</button>
                    <button type="button" onClick={finalizeAttendance} disabled={finalizing} className="eco-btn eco-btn-primary flex-1">
                      <Award className="h-4 w-4" /> {finalizing ? 'Working...' : isFinalized ? 'Issue certificates' : 'Finalize & issue'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
