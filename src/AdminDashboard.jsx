import { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit3,
  FolderOpen,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  Trash2,
  User,
  UserCheck,
  Users,
  UserX,
  X,
  Flag,
  FileText,
  ShieldCheck,
  Building2,
  Ban,
  RotateCcw,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import NotificationBell from "./NotificationBell";
import { API_BASE_URL } from "./config";

// Sidebar Navigation Items
const navItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Organizer Approvals', icon: ShieldCheck },
  { label: 'Activity Oversight', icon: FolderOpen },
  { label: 'Reports', icon: Flag },
  { label: 'User Management', icon: Users },
  { label: 'Announcements', icon: Megaphone },
];


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

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Dropdown State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Logged-in admin's name/email (updated live from Account Settings)
  const [adminProfile, setAdminProfile] = useState(() => JSON.parse(localStorage.getItem('adminInfo') || '{}'));
  const adminName = adminProfile.name || 'Administrator';
  const adminEmail = adminProfile.email || '';

  const handleLogout = () => {
    setShowProfileMenu(false);

    if (onLogout) {
      onLogout();
    }
  };

  const pageMeta = {
    Dashboard: { title: 'Hello, Admin!', subtitle: 'Here’s what’s happening across EcoTask today.' },
    'Organizer Approvals': { title: 'Organizer Approvals', subtitle: 'Review organizer documents and approve or reject accounts.' },
    'Activity Oversight': { title: 'Activity Oversight', subtitle: 'See every activity, hide problem activities, and assign older ones.' },
    Reports: { title: 'Reports', subtitle: 'Activities reported by volunteers.' },
    'User Management': { title: 'User Management', subtitle: 'View and manage volunteer and organizer accounts.' },
    Announcements: { title: 'Announcements', subtitle: 'Post updates for all volunteers.' },
    Settings: { title: 'Account Settings', subtitle: 'Manage your admin profile, password, and sessions.' },
  };
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="eco-app-bg flex h-screen w-screen overflow-hidden font-sans text-slate-800 antialiased">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* GRADIENT SIDEBAR */}
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

          {/* EcoTask Logo */}
          <div className="flex items-center justify-center border-b border-white/10 pb-5">
            <div className="flex items-center text-[26px] font-black tracking-tight text-white">
              <span>Ec</span>
              <span className="mx-[2px] inline-flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="50" cy="50" r="42" stroke="#66BB6A" strokeWidth="12" fill="#1B5E20" />
                  <rect x="45" y="52" width="10" height="22" rx="3" fill="#66BB6A" />
                  <path d="M50 18 L30 48 H70 Z" fill="#66BB6A" />
                  <path d="M50 30 L36 54 H64 Z" fill="#A5D6A7" />
                </svg>
              </span>
              <span>Task</span>
            </div>
          </div>

          {/* Navigation Links */}
          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-eco-200/60">
            Admin menu
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon }) => {
              const isActive = activeTab === label;
              return (
                <button
                  key={label}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    setActiveTab(label);
                    setMobileMenuOpen(false);
                  }}
                  className={`eco-nav-item ${isActive ? 'eco-nav-item-active' : ''}`}
                >
                  <span className="eco-nav-item-icon">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* RIGHT CONTAINER */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="eco-header z-30 flex shrink-0 items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="eco-icon-btn lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-eco-600/80 sm:block">
                {todayLabel}
              </p>
              <h2 className="truncate text-lg font-extrabold text-eco-800">
                {activeTab === 'Dashboard' ? 'Admin Dashboard' : activeTab}
              </h2>
            </div>
          </div>

          {/* HEADER CONTROLS */}
          <div className="flex items-center gap-2.5">
            <NotificationBell
              storageKey="adminInfo"
              onOpen={(item) => {
                if (item.type === 'organizer_application') setActiveTab('Organizer Approvals');
                else setActiveTab('Dashboard');
              }}
            />

            {/* Profile Dropdown */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="flex h-10 items-center gap-2 rounded-full border border-eco-200/70 bg-white pl-1.5 pr-3 shadow-sm transition hover:bg-eco-50 focus:outline-none"
              >
                <div className="eco-avatar h-7 w-7">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="hidden text-xs font-bold text-slate-700 sm:block">Admin</span>
                <ChevronDown className={`h-3.5 w-3.5 text-eco-700 transition ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options */}
              {showProfileMenu && (
                <div className="eco-popover absolute right-0 top-12 z-50 w-56 p-2 text-slate-800">
                  <div className="mb-1 flex items-center gap-3 rounded-xl bg-eco-50/70 px-3 py-2.5">
                    <div className="eco-avatar h-9 w-9">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{adminName}</p>
                      <p className="truncate text-[11px] text-slate-500">{adminEmail}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('Settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-eco-50"
                  >
                    <Settings className="h-4 w-4 text-eco-700" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN VIEW AREA */}
        <main key={activeTab} className="ecotask-page-enter eco-scroll flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-6">
              <h1 className="eco-page-title">{pageMeta[activeTab]?.title || activeTab}</h1>
              {pageMeta[activeTab]?.subtitle && <p className="eco-page-subtitle">{pageMeta[activeTab].subtitle}</p>}
            </div>
            {activeTab === 'Dashboard' && <DashboardView goTo={setActiveTab} />}
            {activeTab === 'Organizer Approvals' && <OrganizerApprovalsView />}
            {activeTab === 'Activity Oversight' && <ActivityOversightView />}
            {activeTab === 'Reports' && <ReportsView />}
            {activeTab === 'User Management' && <UserManagementView />}
            {activeTab === 'Announcements' && <AnnouncementsView />}
            {activeTab === 'Settings' && <SettingsView onProfileChange={setAdminProfile} onSessionEnded={handleLogout} />}
          </div>
        </main>
      </div>
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
   ENVIRONMENTAL DASHBOARD VIEW (LIGHT THEME)
   ========================================== */
function DashboardView({ goTo }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [statsData, setStatsData] = useState({
    activitiesCreated: 0,
    totalVolunteers: 0,
    certificatesIssued: 0,
    pendingOrganizers: 0,
    openReports: 0,
    monthlyRegistrations: [],
  });
  const [statsError, setStatsError] = useState('');
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllAuditLogs, setShowAllAuditLogs] = useState(false);
  const [topVolunteers, setTopVolunteers] = useState([]);
  const [topVolunteersLoading, setTopVolunteersLoading] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/dashboard/admin-stats`, {
          headers: { Authorization: `Bearer ${adminInfo.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load dashboard statistics');
        setStatsData(data);
      } catch (requestError) {
        setStatsError(requestError.message);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadActivityFeed = async () => {
      try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/dashboard/admin-activity-feed`, {
          headers: { Authorization: `Bearer ${adminInfo.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load activity feed');
        setRecentActivities(data);
      } catch (requestError) {
        setStatsError(requestError.message);
      }
    };

    loadActivityFeed();
  }, []);

  // Top volunteers ranked by how many activities they actually attended (marked present).
  useEffect(() => {
    const loadTopVolunteers = async () => {
      try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/dashboard/top-volunteers?limit=5`, {
          headers: { Authorization: `Bearer ${adminInfo.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load top volunteers');
        setTopVolunteers(data);
      } catch (requestError) {
        setStatsError(requestError.message);
      } finally {
        setTopVolunteersLoading(false);
      }
    };

    loadTopVolunteers();
  }, []);

  const stats = [
    { label: 'ACTIVITIES CREATED', value: statsData.activitiesCreated, change: 'From database', icon: Calendar },
    { label: 'TOTAL VOLUNTEERS', value: statsData.totalVolunteers, change: 'From database', icon: Users },
    { label: 'CERTIFICATES ISSUED', value: statsData.certificatesIssued, change: 'From database', icon: Award },
  ];

  // Chart: y-axis labels scale to the busiest month instead of a fixed 600/400/200.
  const CHART_BAR_MAX_PX = 167; // bar area height inside the h-48 chart
  const monthlyRegistrations = statsData.monthlyRegistrations || [];
  const maxCount = Math.max(...monthlyRegistrations.map((entry) => entry.count), 0);
  const axisStep = Math.max(1, Math.ceil(maxCount / 3));
  const axisMax = axisStep * 3;
  const axisLabels = [axisMax, axisStep * 2, axisStep, 0];

  const chartData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => {
    const item = monthlyRegistrations.find((entry) => entry.month.slice(0, 3).toLowerCase() === month.toLowerCase());
    const count = item?.count || 0;
    const height = Math.max(4, Math.round((count / axisMax) * CHART_BAR_MAX_PX));
    return { month: month.toUpperCase(), count, height: `${height}px` };
  });

  const getFeedPresentation = (type) => {
    if (type === 'registration') {
      return { icon: User, color: 'text-eco-700 bg-eco-100/70 border border-eco-200' };
    }
    if (type === 'report') {
      return { icon: Flag, color: 'text-rose-700 bg-rose-100/70 border border-rose-200' };
    }
    if (type === 'announcement') {
      return { icon: Megaphone, color: 'text-amber-700 bg-amber-100/70 border border-amber-200' };
    }
    return { icon: Calendar, color: 'text-blue-700 bg-blue-100/70 border border-blue-200' };
  };

  const formatRelativeTime = (timestamp) => {
    const minutes = Math.max(0, Math.floor((currentTime - new Date(timestamp).getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`;
  };

  const statHints = {
    'ACTIVITIES CREATED': 'All published activities',
    'TOTAL VOLUNTEERS': 'Registered volunteer accounts',
    'CERTIFICATES ISSUED': 'Across all activities',
  };
  const rankStyles = [
    'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-md shadow-amber-500/30',
    'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
    'bg-gradient-to-br from-orange-300 to-orange-500 text-white',
  ];
  const topAttended = Math.max(...topVolunteers.map((vol) => vol.attended), 1);

  const FeedItem = ({ act, boxed = false }) => {
    const presentation = getFeedPresentation(act.type);
    const IconComponent = presentation.icon;
    return (
      <div className={`flex items-start gap-3 ${boxed ? 'rounded-xl border border-slate-100 bg-white p-3' : ''}`}>
        <div className={`shrink-0 rounded-xl p-2 ${presentation.color}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-bold leading-tight text-slate-800">{act.title}</p>
          <p className="text-xs font-medium leading-snug text-slate-500 [overflow-wrap:anywhere]">{act.description}</p>
          <span className="block pt-0.5 text-[11px] font-semibold text-eco-600">{formatRelativeTime(act.timestamp)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {statsError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{statsError}</div>
      )}

      {/* Needs-attention banner */}
      {(statsData.pendingOrganizers > 0 || statsData.openReports > 0) && (
        <div className="flex flex-wrap gap-3">
          {statsData.pendingOrganizers > 0 && (
            <button type="button" onClick={() => goTo('Organizer Approvals')} className="flex flex-1 items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:bg-amber-100">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-bold text-amber-900">{statsData.pendingOrganizers} organizer{statsData.pendingOrganizers === 1 ? '' : 's'} waiting for approval</span>
              <span className="ml-auto text-xs font-bold text-amber-700">Review →</span>
            </button>
          )}
          {statsData.openReports > 0 && (
            <button type="button" onClick={() => goTo('Reports')} className="flex flex-1 items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100">
              <Flag className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-bold text-rose-900">{statsData.openReports} open report{statsData.openReports === 1 ? '' : 's'}</span>
              <span className="ml-auto text-xs font-bold text-rose-700">Review →</span>
            </button>
          )}
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon }) => (
          <StatTile key={label} label={label} value={value} icon={icon} hint={statHints[label]} />
        ))}
      </div>

      {/* Middle Row: Chart & Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="eco-card flex flex-col overflow-hidden lg:col-span-2">
          <CardTitle
            icon={Activity}
            right={<span className="eco-badge eco-badge-green">Year {new Date().getFullYear()}</span>}
          >
            Volunteer Registration Trend
          </CardTitle>

          <div className="flex-1 p-5">
            <div className="relative flex h-48 items-end justify-between gap-1 px-1 pb-1 sm:gap-2">
              {/* grid lines */}
              <div className="pointer-events-none absolute inset-x-0 bottom-[25px] top-0 ml-8 flex flex-col justify-between">
                {axisLabels.map((label, index) => (
                  <span key={index} className="border-t border-dashed border-eco-100" />
                ))}
              </div>

              <div className="relative mr-2 flex h-full flex-col justify-between pb-[21px] text-right text-[11px] font-bold text-slate-400">
                {axisLabels.map((label, index) => (
                  <span key={index} className="-translate-y-1/2 leading-none">{label}</span>
                ))}
              </div>

              {chartData.map(({ month, count, height }) => (
                <div key={month} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="pointer-events-none absolute -top-1 z-10 hidden rounded-md bg-eco-800 px-2 py-0.5 text-[10px] font-bold text-white shadow-md group-hover:block">
                    {count}
                  </span>
                  <div
                    style={{ height }}
                    className={`w-full max-w-[30px] rounded-t-lg transition-all group-hover:brightness-110 ${
                      count > 0 ? 'bg-gradient-to-t from-eco-700 via-eco-600 to-eco-400 shadow-[0_6px_14px_-6px_rgba(27,94,32,0.6)]' : 'bg-eco-100'
                    }`}
                  />
                  <span className="text-[10px] font-bold leading-[15px] text-slate-500">{month}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="eco-card flex flex-col overflow-hidden">
          <CardTitle icon={Clock}>Recent Activity</CardTitle>
          <div className="flex-1 space-y-4 p-5">
            {recentActivities.length > 0
              ? recentActivities.slice(0, 4).map((act) => <FeedItem key={act.id} act={act} />)
              : (
                <div className="eco-empty">
                  <Clock className="h-5 w-5 text-eco-400" />
                  No recent activity yet.
                </div>
              )}
          </div>
          <button
            type="button"
            onClick={() => setShowAllAuditLogs(true)}
            className="border-t border-eco-100 px-5 py-3 text-center text-xs font-bold text-eco-700 transition hover:bg-eco-50 hover:text-eco-800"
          >
            View all audit logs →
          </button>
        </section>
      </div>

      {showAllAuditLogs && (
        <div
          className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllAuditLogs(false)}
        >
          <div
            className="ecotask-modal-panel eco-modal relative max-h-[80vh] w-full max-w-2xl overflow-hidden text-slate-800"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="eco-card-header">
              <div className="flex items-center gap-3">
                <span className="eco-icon-tile h-9 w-9 rounded-xl"><Clock className="h-4 w-4" /></span>
                <div>
                  <h3 className="text-base font-extrabold">All Audit Logs</h3>
                  <p className="text-xs text-slate-500">Recent system activity across EcoTask.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllAuditLogs(false)}
                aria-label="Close audit logs"
                className="rounded-full p-1.5 text-eco-700 hover:bg-eco-50 focus:outline-none focus:ring-2 focus:ring-eco-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="eco-scroll max-h-[62vh] space-y-2.5 overflow-y-auto bg-slate-50/60 p-5">
              {recentActivities.length > 0
                ? recentActivities.map((act) => <FeedItem key={act.id} act={act} boxed />)
                : <div className="eco-empty">No audit logs yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row: Top Contributors */}
      <section className="eco-card overflow-hidden">
        <CardTitle icon={Award} right={<span className="text-[11px] font-semibold text-slate-500">Ranked by activities attended</span>}>
          Top Volunteer Contributors
        </CardTitle>
        <div className="p-3 sm:p-4">
          {topVolunteersLoading && (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-eco-50" />)}
            </div>
          )}

          {!topVolunteersLoading && topVolunteers.length === 0 && (
            <div className="eco-empty">
              <Award className="h-5 w-5 text-eco-400" />
              No attendance recorded yet. Mark volunteers as present in Participation Record.
            </div>
          )}

          <div className="space-y-1.5">
            {topVolunteers.map((vol, index) => (
              <div key={vol.userId} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-eco-50/60 sm:px-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  rankStyles[index] || 'bg-slate-100 text-slate-600'
                }`}>
                  {index + 1}
                </span>
                <div className="eco-avatar h-9 w-9 text-xs">{getInitials(vol.name)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-bold text-slate-800">{vol.name}</p>
                    <span className="eco-badge eco-badge-green shrink-0">{vol.attended} attended</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="eco-progress h-1.5 flex-1">
                      <span style={{ width: `${Math.round((vol.attended / topAttended) * 100)}%` }} />
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-slate-500">
                      Joined {vol.joined} activit{vol.joined === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ==========================================
   SHARED: REASON / CONFIRM MODAL
   ========================================== */
function ReasonModal({ title, description, label, placeholder, confirmLabel, danger = false, required = false, onConfirm, onClose }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (required && text.trim().length < 5) {
      setError('Please write at least 5 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onConfirm(text.trim());
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };

  return (
    <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 text-slate-800">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-md p-6">
        <h3 className="text-base font-extrabold">{title}</h3>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>}
        {label && (
          <div className="mt-4">
            <label className="eco-label">{label}{required ? ' *' : ' (optional)'}</label>
            <textarea
              rows={4}
              maxLength={500}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="eco-input resize-y"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">{text.length}/500</p>
          </div>
        )}
        {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="eco-btn eco-btn-secondary">Cancel</button>
          <button type="button" onClick={submit} disabled={saving} className={`eco-btn ${danger ? 'eco-btn-danger' : 'eco-btn-primary'}`}>
            {saving ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const adminFetch = async (path, options = {}) => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminInfo.token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

/* ==========================================
   ORGANIZER APPROVALS VIEW
   ========================================== */
function OrganizerApprovalsView() {
  const [organizers, setOrganizers] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(null); // { url, type, name }
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = async () => {
    try {
      setOrganizers(await adminFetch('/api/admin/organizers'));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Free the preview's object URL when it closes.
  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const openDocument = async (organizer, doc) => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const response = await fetch(`${API_BASE_URL}/api/admin/organizers/${organizer._id}/documents/${doc._id}`, {
        headers: { Authorization: `Bearer ${adminInfo.token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to open document');
      }
      const blob = await response.blob();
      setPreview({ url: URL.createObjectURL(blob), type: doc.mimeType, name: doc.originalName });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const approve = async () => {
    const data = await adminFetch(`/api/admin/organizers/${approveTarget._id}/approve`, { method: 'PATCH' });
    setOrganizers((current) => current.map((o) => (o._id === approveTarget._id ? { ...o, ...data.organizer } : o)));
    setNotice(data.message);
    setApproveTarget(null);
  };

  const reject = async (reason) => {
    const data = await adminFetch(`/api/admin/organizers/${rejectTarget._id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    setOrganizers((current) => current.map((o) => (o._id === rejectTarget._id ? { ...o, ...data.organizer } : o)));
    setNotice(data.message);
    setRejectTarget(null);
  };

  const counts = organizers.reduce((acc, o) => ({ ...acc, [o.organizerStatus]: (acc[o.organizerStatus] || 0) + 1 }), {});
  const visible = organizers.filter((o) => filter === 'all' || o.organizerStatus === filter);
  const statusBadge = {
    pending: <span className="eco-badge eco-badge-amber">Pending review</span>,
    approved: <span className="eco-badge eco-badge-green">Approved</span>,
    rejected: <span className="eco-badge eco-badge-red">Rejected</span>,
  };

  if (loading) return <div className="eco-card mx-auto h-80 max-w-6xl animate-pulse bg-white/70" />;

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-800">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All' },
        ].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setFilter(key)} className={`eco-chip ${filter === key ? 'eco-chip-active' : ''}`}>
            {label}
            <span className="eco-chip-count">{key === 'all' ? organizers.length : counts[key] || 0}</span>
          </button>
        ))}
      </div>

      {notice && <div className="rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-sm font-semibold text-eco-800">{notice}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visible.map((organizer) => (
          <article key={organizer._id} className="eco-card flex flex-col overflow-hidden">
            <div className="flex items-start gap-3 border-b border-eco-100 p-5">
              <span className="eco-avatar h-11 w-11 text-sm">{getInitials(organizer.organizationName || organizer.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-extrabold">{organizer.organizationName || '—'}</h3>
                  {statusBadge[organizer.organizerStatus]}
                </div>
                <p className="text-sm text-slate-600">{organizer.name}</p>
                <p className="text-xs text-slate-500">{organizer.email} · {organizer.phone || 'no phone'}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Applied {new Date(organizer.createdAt).toLocaleDateString()}
                  {organizer.organizerStatus === 'approved' && ` · ${organizer.activityCount} activit${organizer.activityCount === 1 ? 'y' : 'ies'}`}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-2 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verification documents</p>
              {organizer.documents.map((doc) => (
                <button
                  key={doc._id}
                  type="button"
                  onClick={() => openDocument(organizer, doc)}
                  className="flex w-full items-center gap-3 rounded-xl border border-eco-100 bg-eco-50/40 px-3 py-2.5 text-left text-xs transition hover:border-eco-300 hover:bg-eco-50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-eco-600" />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{doc.originalName}</span>
                  <span className="shrink-0 text-slate-400">{(doc.size / 1024).toFixed(0)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </button>
              ))}
              {organizer.documents.length === 0 && <p className="text-xs text-slate-400">No documents uploaded.</p>}
              {organizer.organizerStatus === 'rejected' && organizer.rejectionReason && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700"><span className="font-bold">Rejection reason:</span> {organizer.rejectionReason}</p>
              )}
            </div>

            {organizer.organizerStatus !== 'approved' && (
              <div className="flex justify-end gap-2 border-t border-eco-100 bg-eco-50/40 px-5 py-3">
                {organizer.organizerStatus === 'pending' && (
                  <button type="button" onClick={() => setRejectTarget(organizer)} className="eco-btn eco-btn-danger-soft eco-btn-sm">
                    <UserX className="h-4 w-4" /> Reject
                  </button>
                )}
                <button type="button" onClick={() => setApproveTarget(organizer)} className="eco-btn eco-btn-primary eco-btn-sm">
                  <UserCheck className="h-4 w-4" /> Approve
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="eco-empty py-12">
          <ShieldCheck className="h-6 w-6 text-eco-400" />
          {filter === 'pending' ? 'No organizers waiting for approval.' : 'No organizers in this list.'}
        </div>
      )}

      {preview && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setPreview(null)} />
          <div className="ecotask-modal-panel eco-modal relative z-10 flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden">
            <div className="eco-card-header">
              <p className="truncate text-sm font-bold">{preview.name}</p>
              <div className="flex items-center gap-2">
                <a href={preview.url} download={preview.name} className="eco-btn eco-btn-secondary eco-btn-sm">Download</a>
                <button type="button" onClick={() => setPreview(null)} aria-label="Close" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-3">
              {preview.type === 'application/pdf'
                ? <iframe title={preview.name} src={preview.url} className="h-full w-full rounded-lg bg-white" />
                : <img src={preview.url} alt={preview.name} className="max-h-full max-w-full rounded-lg object-contain shadow" />}
            </div>
          </div>
        </div>
      )}

      {approveTarget && (
        <ReasonModal
          title={`Approve ${approveTarget.organizationName || approveTarget.name}?`}
          description="They will be able to post activities, record attendance, and issue certificates."
          confirmLabel="Approve organizer"
          onConfirm={approve}
          onClose={() => setApproveTarget(null)}
        />
      )}

      {rejectTarget && (
        <ReasonModal
          title={`Reject ${rejectTarget.organizationName || rejectTarget.name}?`}
          description="The organizer will see this reason and can upload new documents to apply again."
          label="Reason"
          placeholder="e.g. The business permit is expired. Please upload a valid permit."
          confirmLabel="Reject application"
          danger
          required
          onConfirm={reject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}

/* ==========================================
   ACTIVITY OVERSIGHT VIEW
   ========================================== */
function ActivityOversightView() {
  const [activities, setActivities] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [assignChoice, setAssignChoice] = useState({});
  const [search, setSearch] = useState('');
  const [listView, setListView] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [hideTarget, setHideTarget] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [activityData, organizerData] = await Promise.all([
          adminFetch('/api/activities'),
          adminFetch('/api/admin/organizers?status=active'),
        ]);
        setActivities(sortActivitiesByStatus(activityData));
        setOrganizers(organizerData);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const replaceActivity = (updated) => {
    setActivities((current) => current.map((a) => (a._id === updated._id ? { ...a, ...updated, participants: a.participants, openReports: a.openReports } : a)));
  };

  const setVisibility = async (activity, hidden, reason = '') => {
    const data = await adminFetch(`/api/admin/activities/${activity._id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ hidden, reason }),
    });
    replaceActivity(data.activity);
    setNotice(data.message);
    setHideTarget(null);
  };

  const assign = async (activity) => {
    try {
      const data = await adminFetch(`/api/admin/activities/${activity._id}/organizer`, {
        method: 'PATCH',
        body: JSON.stringify({ organizerId: assignChoice[activity._id] }),
      });
      replaceActivity(data.activity);
      setNotice(data.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  // Two separate lists. Active: today first, then the soonest. Past: the most recent first.
  const isPast = (a) => getActivityStatus(a.date) === 'Completed';
  const activeActivities = sortActivitiesByStatus(activities.filter((a) => !isPast(a)));
  const pastActivities = sortActivitiesByStatus(activities.filter(isPast)).reverse();
  const filtered = (listView === 'past' ? pastActivities : activeActivities).filter((a) => (
    `${a.title} ${a.location} ${a.organizer?.organizationName || ''}`.toLowerCase().includes(search.toLowerCase())
  ));

  if (loading) return <div className="eco-card mx-auto h-80 max-w-6xl animate-pulse bg-white/70" />;

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-800">
      <p className="text-sm text-slate-600">
        Organizers create and manage activities. Here you can hide an activity from volunteers, or assign an older activity to an approved organizer.
      </p>

      {notice && <div className="rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-sm font-semibold text-eco-800">{notice}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="eco-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-eco-100 p-4">
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
          <div className="flex w-full items-center gap-2 rounded-xl border border-eco-100 bg-eco-50/50 px-3.5 py-2.5 sm:w-80">
            <Search className="h-4 w-4 text-eco-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, place, organizer..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
          </div>
        </div>

        <div className="eco-scroll overflow-x-auto p-3">
          <table className="eco-table min-w-[860px]">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Organizer</th>
                <th>Volunteers</th>
                <th>Reports</th>
                <th>Visibility</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((activity) => (
                <tr key={activity._id}>
                  <td>
                    <p className="font-bold text-slate-800">{activity.title}</p>
                    <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()} · {getActivityStatus(activity.date)}</p>
                  </td>
                  <td>
                    {activity.organizer ? (
                      <span className="text-sm font-semibold text-slate-700">{activity.organizer.organizationName || activity.organizer.name}</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={assignChoice[activity._id] || ''}
                          onChange={(e) => setAssignChoice({ ...assignChoice, [activity._id]: e.target.value })}
                          className="eco-input w-40 py-1.5 text-xs"
                        >
                          <option value="">Unassigned…</option>
                          {organizers.map((o) => <option key={o._id} value={o._id}>{o.organizationName || o.name}</option>)}
                        </select>
                        <button type="button" disabled={!assignChoice[activity._id]} onClick={() => assign(activity)} className="eco-btn eco-btn-secondary eco-btn-sm">Assign</button>
                      </div>
                    )}
                  </td>
                  <td className="font-semibold">{activity.participants?.length || 0}/{activity.volunteerLimit}</td>
                  <td>{activity.openReports > 0 ? <span className="eco-badge eco-badge-amber">{activity.openReports} open</span> : <span className="text-xs text-slate-400">None</span>}</td>
                  <td>
                    {activity.isHidden
                      ? <span className="eco-badge eco-badge-red" title={activity.hiddenReason}>Hidden</span>
                      : activity.hiddenBySuspension
                        ? <span className="eco-badge eco-badge-gray" title="The organizer's account is suspended">Organizer suspended</span>
                        : <span className="eco-badge eco-badge-green">Visible</span>}
                  </td>
                  <td className="text-right">
                    {activity.isHidden ? (
                      <button type="button" onClick={() => setVisibility(activity, false).catch((e) => setError(e.message))} className="eco-btn eco-btn-secondary eco-btn-sm">Unhide</button>
                    ) : (
                      <button type="button" onClick={() => setHideTarget(activity)} className="eco-btn eco-btn-danger-soft eco-btn-sm">Hide</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">{search ? 'No activities found.' : listView === 'past' ? 'No past events yet.' : 'No active activities.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hideTarget && (
        <ReasonModal
          title={`Hide "${hideTarget.title}"?`}
          description="Volunteers will no longer see or join it. The organizer will see your reason."
          label="Reason"
          placeholder="e.g. Reported as misleading; details don't match the location."
          confirmLabel="Hide activity"
          danger
          required
          onConfirm={(reason) => setVisibility(hideTarget, true, reason)}
          onClose={() => setHideTarget(null)}
        />
      )}
    </div>
  );
}

/* ==========================================
   REPORTED ACTIVITY DETAILS (opened from Reports)
   Uses GET /api/activities, which already returns full details for admins.
   ========================================== */
const getActivityImageUrl = (image) => (
  image?.startsWith('/uploads/') ? `${API_BASE_URL}${image}` : image
);

function ActivityDetailsModal({ activityId, onClose, footer }) {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminFetch('/api/activities')
      .then((list) => {
        if (cancelled) return;
        const found = list.find((item) => item._id === activityId);
        if (found) setActivity(found);
        else setError('This activity no longer exists.');
      })
      .catch((requestError) => !cancelled && setError(requestError.message));
    return () => { cancelled = true; };
  }, [activityId]);

  const organizer = activity?.organizer;
  const participants = activity?.participants || [];
  const image = getActivityImageUrl(activity?.coverImage);

  return (
    <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="ecotask-modal-panel eco-modal eco-scroll relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <div className="relative h-44 bg-gradient-to-r from-eco-700 via-eco-600 to-eco-400">
          {image && <img src={image} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full bg-black/30 p-1.5 text-white transition hover:bg-black/50">
            <X className="h-4 w-4" />
          </button>
          {activity && (
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eco-badge eco-badge-green capitalize">{activity.status || getActivityStatus(activity.date)}</span>
                {activity.isHidden && <span className="eco-badge eco-badge-red">Hidden</span>}
                {activity.hiddenBySuspension && <span className="eco-badge eco-badge-gray">Organizer suspended</span>}
              </div>
              <h3 className="mt-1.5 text-xl font-extrabold text-white [overflow-wrap:anywhere]">{activity.title}</h3>
            </div>
          )}
        </div>

        {!activity && !error && <div className="h-72 animate-pulse" />}
        {error && <p className="m-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}

        {activity && (
          <div className="space-y-5 p-6">
            {activity.isHidden && activity.hiddenReason && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                <p className="font-bold">Hidden from volunteers</p>
                <p className="mt-0.5 [overflow-wrap:anywhere]">{activity.hiddenReason}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
              {[
                { icon: Building2, label: 'Organizer', value: organizer?.organizationName || organizer?.name || 'Unassigned' },
                { icon: Calendar, label: 'Date & time', value: `${new Date(activity.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}${activity.time ? ` · ${activity.time}` : ''}` },
                { icon: Home, label: 'Location', value: activity.location || '—' },
                { icon: Flag, label: 'Meeting place', value: activity.meetingPlace || '—' },
                { icon: Users, label: 'Volunteers', value: `${participants.length} / ${activity.volunteerLimit}` },
                { icon: Clock, label: 'Created', value: activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5 rounded-xl border border-eco-100 bg-eco-50/50 px-3 py-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-eco-600" />
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                    <p className="mt-0.5 font-semibold text-slate-700 [overflow-wrap:anywhere]">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="eco-label">Description</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{activity.description}</p>
            </div>

            <div>
              <p className="eco-label">Joined volunteers ({participants.length})</p>
              {participants.length > 0 ? (
                <ul className="eco-scroll max-h-48 divide-y divide-eco-100 overflow-y-auto rounded-xl border border-eco-100">
                  {participants.map((person) => (
                    <li key={person._id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-700">{person.name}</span>
                      <span className="text-slate-500">{person.email}{person.phone ? ` · ${person.phone}` : ''}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No volunteers have joined yet.</p>
              )}
            </div>
          </div>
        )}

        {activity && footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-eco-100 bg-eco-50/40 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================
   REPORTS VIEW
   ========================================== */
function ReportsView() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({}); // { [activityKey]: true }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // { type: 'dismiss' | 'dismiss-all' | 'hide', group, report? }
  const [action, setAction] = useState(null);
  // Group whose activity details are open in the details card.
  const [detailsGroup, setDetailsGroup] = useState(null);

  const load = async (status) => {
    setLoading(true);
    try {
      setReports(await adminFetch(`/api/reports${status === 'all' ? '' : `?status=${status}`}`));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    setExpanded({});
  }, [filter]);

  // Group the flat report list by activity
  const groups = Object.values(
    reports.reduce((acc, report) => {
      const key = report.activity?._id || 'deleted';
      if (!acc[key]) acc[key] = { key, activity: report.activity, reports: [] };
      acc[key].reports.push(report);
      return acc;
    }, {})
  )
    .map((group) => {
      const openReports = group.reports.filter((r) => r.status === 'open');
      const reasonCounts = group.reports.reduce((acc, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1;
        return acc;
      }, {});
      const latest = Math.max(...group.reports.map((r) => new Date(r.createdAt).getTime()));
      return { ...group, openReports, reasonCounts, latest };
    })
    // Most open reports first, then most recent
    .sort((a, b) => b.openReports.length - a.openReports.length || b.latest - a.latest)
    .filter((group) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      const organizer = group.activity?.organizer;
      return [group.activity?.title, organizer?.organizationName, organizer?.name]
        .some((value) => value?.toLowerCase().includes(term));
    });

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const patchReport = (id, type, note) =>
    adminFetch(`/api/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ action: type, note }) });

  const resolve = async (note) => {
    if (action.type === 'dismiss') {
      const data = await patchReport(action.report._id, 'dismiss', note);
      setNotice(data.message);
    } else if (action.type === 'dismiss-all') {
      for (const report of action.group.openReports) {
        await patchReport(report._id, 'dismiss', note);
      }
      setNotice(`${action.group.openReports.length} report(s) dismissed.`);
    } else {
      // Hiding via any open report closes every open report on that activity
      const data = await patchReport(action.group.openReports[0]._id, 'hide', note);
      setNotice(data.message);
    }
    setAction(null);
    load(filter);
  };

  const statusBadge = {
    open: <span className="eco-badge eco-badge-amber">Open</span>,
    dismissed: <span className="eco-badge eco-badge-gray">Dismissed</span>,
    actioned: <span className="eco-badge eco-badge-red">Activity hidden</span>,
  };

  const totalOpen = groups.reduce((sum, g) => sum + g.openReports.length, 0);

  const modalText = {
    hide: {
      title: 'Hide this activity?',
      description: 'Volunteers will no longer see it, and every open report on it will be closed. The organizer will see your reason.',
      label: 'Reason',
      placeholder: 'e.g. The activity details were misleading.',
      confirmLabel: 'Hide activity',
    },
    'dismiss-all': {
      title: 'Dismiss all open reports?',
      description: 'The activity stays visible. Every open report on this activity will be marked as dismissed.',
      label: 'Note',
      placeholder: 'e.g. Checked with the organizer; details are correct.',
      confirmLabel: 'Dismiss all',
    },
    dismiss: {
      title: 'Dismiss this report?',
      description: 'The activity stays visible. Use this when the report is not valid.',
      label: 'Note',
      placeholder: 'e.g. Checked with the organizer; details are correct.',
      confirmLabel: 'Dismiss report',
    },
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['open', 'dismissed', 'actioned', 'all'].map((key) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`eco-chip capitalize ${filter === key ? 'eco-chip-active' : ''}`}>
              {key === 'actioned' ? 'Hidden' : key}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity or organizer"
            className="eco-input pl-9"
          />
        </div>
      </div>

      {!loading && groups.length > 0 && (
        <p className="text-xs font-semibold text-slate-500">
          {groups.length} activit{groups.length === 1 ? 'y' : 'ies'} · {filter === 'open' || filter === 'all' ? `${totalOpen} open report(s)` : `${groups.reduce((s, g) => s + g.reports.length, 0)} report(s)`}
        </p>
      )}

      {notice && <div className="rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-sm font-semibold text-eco-800">{notice}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      {loading ? (
        <div className="eco-card h-64 animate-pulse bg-white/70" />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isOpen = !!expanded[group.key];
            const activity = group.activity;
            const organizer = activity?.organizer;
            return (
              <article key={group.key} className="eco-card overflow-hidden">
                {/* Activity header (click to expand) */}
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-eco-50/50"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
                    <Flag className="h-5 w-5" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                      {group.reports.length}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold">{activity?.title || 'Deleted activity'}</h3>
                      {group.openReports.length > 0 && (
                        <span className="eco-badge eco-badge-amber">{group.openReports.length} open</span>
                      )}
                      {activity?.isHidden && <span className="eco-badge eco-badge-red">Hidden</span>}
                    </div>
                    <p className="text-xs text-slate-500">
                      Organizer: {organizer?.organizationName || organizer?.name || 'Unassigned'}
                      {activity?.date && ` · ${new Date(activity.date).toLocaleDateString()}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(group.reasonCounts).map(([reason, count]) => (
                        <span key={reason} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {reason}{count > 1 && ` ×${count}`}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Activity-level actions */}
                {activity && (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-eco-100 px-5 py-3">
                    <button type="button" onClick={() => setDetailsGroup(group)} className="eco-btn eco-btn-secondary eco-btn-sm mr-auto">
                      <Eye className="h-3.5 w-3.5" /> View activity details
                    </button>
                    {group.openReports.length > 0 && (<>
                    <button type="button" onClick={() => setAction({ type: 'dismiss-all', group })} className="eco-btn eco-btn-secondary eco-btn-sm">
                      Dismiss all ({group.openReports.length})
                    </button>
                    {!activity.isHidden && (
                      <button type="button" onClick={() => setAction({ type: 'hide', group })} className="eco-btn eco-btn-danger-soft eco-btn-sm">
                        Hide activity
                      </button>
                    )}
                    </>)}
                  </div>
                )}

                {/* Individual reports */}
                {isOpen && (
                  <ul className="divide-y divide-eco-100 border-t border-eco-100 bg-slate-50/60">
                    {group.reports.map((report) => (
                      <li key={report._id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-700">{report.reason}</p>
                              {statusBadge[report.status]}
                            </div>
                            {report.details && <p className="mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">"{report.details}"</p>}
                            <p className="mt-1.5 text-[11px] text-slate-400">
                              Reported by {report.reporter?.name || 'Deleted user'} ({report.reporter?.email || '—'}) · {new Date(report.createdAt).toLocaleString()}
                            </p>
                            {report.status !== 'open' && (
                              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                                Resolved by {report.resolvedBy?.name || 'admin'} on {new Date(report.resolvedAt).toLocaleDateString()}
                                {report.adminNote && <> · <span className="font-semibold">Note:</span> {report.adminNote}</>}
                              </p>
                            )}
                          </div>
                          {report.status === 'open' && (
                            <button type="button" onClick={() => setAction({ type: 'dismiss', group, report })} className="eco-btn eco-btn-secondary eco-btn-sm">
                              Dismiss
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {!isOpen && (
                  <button type="button" onClick={() => toggle(group.key)} className="w-full border-t border-eco-100 py-2 text-xs font-semibold text-eco-700 hover:bg-eco-50">
                    View {group.reports.length} report{group.reports.length === 1 ? '' : 's'}
                  </button>
                )}
              </article>
            );
          })}
          {groups.length === 0 && (
            <div className="eco-empty py-12">
              <CheckCircle2 className="h-6 w-6 text-eco-400" />
              {search ? 'No activities match your search.' : filter === 'open' ? 'No open reports. All clear!' : 'No reports in this list.'}
            </div>
          )}
        </div>
      )}

      {detailsGroup && (
        <ActivityDetailsModal
          activityId={detailsGroup.activity._id}
          onClose={() => setDetailsGroup(null)}
          footer={detailsGroup.openReports.length > 0 && (
            <>
              <button type="button" onClick={() => { setAction({ type: 'dismiss-all', group: detailsGroup }); setDetailsGroup(null); }} className="eco-btn eco-btn-secondary eco-btn-sm">
                Dismiss all ({detailsGroup.openReports.length})
              </button>
              {!detailsGroup.activity.isHidden && (
                <button type="button" onClick={() => { setAction({ type: 'hide', group: detailsGroup }); setDetailsGroup(null); }} className="eco-btn eco-btn-danger-soft eco-btn-sm">
                  Hide activity
                </button>
              )}
            </>
          )}
        />
      )}

      {action && (
        <ReasonModal
          {...modalText[action.type]}
          danger={action.type === 'hide'}
          required={action.type === 'hide'}
          onConfirm={resolve}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  );
}

/* ==========================================
   USER MANAGEMENT VIEW
   ========================================== */
/* ==========================================
   USER MANAGEMENT (tabs: Volunteers / Organizers)
   ========================================== */
function UserManagementView() {
  const [tab, setTab] = useState('volunteers');

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex gap-2">
        {[
          { key: 'volunteers', label: 'Volunteers', icon: Users },
          { key: 'organizers', label: 'Organizers', icon: Building2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`eco-chip gap-1.5 ${tab === key ? 'eco-chip-active' : ''}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>
      {tab === 'volunteers' ? <VolunteerManagementView /> : <OrganizerManagementView />}
    </div>
  );
}

const formatShortDate = (value) => (
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
);

// One place to decide how an organizer's account status is shown
const getOrganizerAccountStatus = (organizer) => {
  if (organizer.isSuspended) return { key: 'suspended', label: 'Suspended', badge: 'eco-badge-red' };
  if (organizer.organizerStatus === 'approved') return { key: 'active', label: 'Active', badge: 'eco-badge-green' };
  if (organizer.organizerStatus === 'rejected') return { key: 'rejected', label: 'Rejected', badge: 'eco-badge-gray' };
  return { key: 'pending', label: 'Pending', badge: 'eco-badge-amber' };
};

/* ==========================================
   ORGANIZER MANAGEMENT
   ========================================== */
function OrganizerManagementView() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [detailsId, setDetailsId] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try {
      setOrganizers(await adminFetch('/api/admin/organizers'));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = organizers.reduce((acc, o) => {
    const key = getOrganizerAccountStatus(o).key;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const term = search.trim().toLowerCase();
  const filtered = organizers.filter((o) => {
    if (filter !== 'all' && getOrganizerAccountStatus(o).key !== filter) return false;
    if (!term) return true;
    return [o.name, o.email, o.organizationName].some((v) => v?.toLowerCase().includes(term));
  });

  const afterAction = (message) => {
    setNotice(message);
    setSuspendTarget(null);
    setReactivateTarget(null);
    setDeleteTarget(null);
    load();
  };

  const suspend = async (reason) => {
    const data = await adminFetch(`/api/admin/organizers/${suspendTarget._id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    afterAction(data.message);
  };

  const reactivate = async () => {
    const data = await adminFetch(`/api/admin/organizers/${reactivateTarget._id}/reactivate`, { method: 'PATCH' });
    afterAction(data.message);
  };

  const remove = async () => {
    const data = await adminFetch(`/api/admin/organizers/${deleteTarget._id}`, { method: 'DELETE' });
    setDetailsId(null);
    afterAction(data.message);
  };

  if (loading) return <div className="eco-card h-96 animate-pulse bg-white/70" />;

  const orgName = (o) => o.organizationName || o.name;

  return (
    <div className="space-y-5 text-slate-800">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total organizers" value={organizers.length} icon={Building2} />
        <StatTile label="Active" value={counts.active || 0} icon={UserCheck} />
        <StatTile label="Suspended" value={counts.suspended || 0} icon={Ban} />
        <StatTile label="Pending approval" value={counts.pending || 0} icon={Clock} />
      </div>

      {notice && <div className="rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-sm font-semibold text-eco-800">{notice}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="eco-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-eco-100 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All', organizers.length],
              ['active', 'Active', counts.active || 0],
              ['suspended', 'Suspended', counts.suspended || 0],
              ['pending', 'Pending', counts.pending || 0],
              ['rejected', 'Rejected', counts.rejected || 0],
            ].map(([key, label, count]) => (
              <button key={key} type="button" onClick={() => setFilter(key)} className={`eco-chip ${filter === key ? 'eco-chip-active' : ''}`}>
                {label} <span className="eco-chip-count">{count}</span>
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-2 rounded-xl border border-eco-100 bg-eco-50/50 px-3.5 py-2.5 text-slate-700 transition focus-within:border-eco-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-eco-200/40 sm:w-72">
            <Search className="h-4 w-4 text-eco-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or organization..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="eco-scroll overflow-x-auto p-3">
          <table className="eco-table min-w-[820px]">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Contact person</th>
                <th>Activities</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const status = getOrganizerAccountStatus(o);
                return (
                  <tr key={o._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="eco-avatar h-9 w-9 text-xs">{getInitials(orgName(o))}</span>
                        <p className="max-w-[220px] truncate font-bold text-slate-800">{orgName(o)}</p>
                      </div>
                    </td>
                    <td>
                      <p className="truncate font-semibold text-slate-700">{o.name}</p>
                      <p className="truncate text-xs text-slate-500">{o.email}</p>
                    </td>
                    <td className="font-extrabold text-slate-800">{o.activityCount || 0}</td>
                    <td className="text-slate-600">{formatShortDate(o.createdAt)}</td>
                    <td>
                      <span className={`eco-badge ${status.badge}`} title={o.isSuspended ? o.suspendedReason : undefined}>{status.label}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => setDetailsId(o._id)} className="eco-btn eco-btn-secondary eco-btn-sm">View</button>
                        {status.key === 'active' && (
                          <button type="button" onClick={() => setSuspendTarget(o)} className="eco-btn eco-btn-danger-soft eco-btn-sm">Suspend</button>
                        )}
                        {status.key === 'suspended' && (
                          <button type="button" onClick={() => setReactivateTarget(o)} className="eco-btn eco-btn-secondary eco-btn-sm">Reactivate</button>
                        )}
                        <button type="button" onClick={() => setDeleteTarget(o)} aria-label={`Delete ${orgName(o)}`} className="eco-btn eco-btn-danger-soft eco-btn-sm">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    {organizers.length === 0 ? 'No organizer accounts yet.' : 'No organizers match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(counts.pending || 0) > 0 && (
          <p className="border-t border-eco-100 px-5 py-3 text-xs text-slate-500">
            Pending organizers are approved or rejected in <span className="font-bold text-eco-700">Organizer Approvals</span>.
          </p>
        )}
      </div>

      {detailsId && (
        <OrganizerDetailsModal
          organizerId={detailsId}
          onClose={() => setDetailsId(null)}
          onSuspend={(o) => setSuspendTarget(o)}
          onReactivate={(o) => setReactivateTarget(o)}
          onDelete={(o) => setDeleteTarget(o)}
          refreshKey={notice}
        />
      )}

      {suspendTarget && (
        <ReasonModal
          title={`Suspend ${orgName(suspendTarget)}?`}
          description="They won't be able to log in, and all of their activities will be hidden from volunteers until you reactivate the account. Volunteer and certificate records are kept."
          label="Reason"
          placeholder="e.g. Multiple verified reports of misleading activities."
          confirmLabel="Suspend organizer"
          danger
          required
          onConfirm={suspend}
          onClose={() => setSuspendTarget(null)}
        />
      )}

      {reactivateTarget && (
        <ReasonModal
          title={`Reactivate ${orgName(reactivateTarget)}?`}
          description="They can log in again and their activities become visible to volunteers. Activities you hid because of reports stay hidden."
          confirmLabel="Reactivate"
          onConfirm={reactivate}
          onClose={() => setReactivateTarget(null)}
        />
      )}

      {deleteTarget && (
        <ReasonModal
          title={`Delete ${orgName(deleteTarget)}?`}
          description={`The account and uploaded documents are removed permanently. Their ${deleteTarget.activityCount || 0} activit${deleteTarget.activityCount === 1 ? 'y' : 'ies'} will be kept but hidden and unassigned. You can assign them to another organizer in Activity Oversight. This cannot be undone.`}
          confirmLabel="Delete organizer"
          danger
          onConfirm={remove}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------
   Organizer details modal
   ------------------------------------------ */
function OrganizerDetailsModal({ organizerId, onClose, onSuspend, onReactivate, onDelete, refreshKey }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminFetch(`/api/admin/organizers/${organizerId}`)
      .then((data) => { if (!cancelled) setDetails(data); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [organizerId, refreshKey]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const openDocument = async (doc) => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const response = await fetch(`${API_BASE_URL}/api/admin/organizers/${organizerId}/documents/${doc._id}`, {
        headers: { Authorization: `Bearer ${adminInfo.token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to open document');
      }
      const blob = await response.blob();
      setPreview({ url: URL.createObjectURL(blob), type: doc.mimeType, name: doc.originalName });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const status = details ? getOrganizerAccountStatus(details) : null;
  const orgName = details ? details.organizationName || details.name : '';

  return (
    <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="ecotask-modal-panel eco-modal eco-scroll relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <div className="relative h-20 bg-gradient-to-r from-eco-700 via-eco-600 to-eco-400">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!details && !error && <div className="h-72 animate-pulse" />}
        {error && <p className="m-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}

        {details && (
          <>
            <div className="relative z-10 -mt-9 flex flex-col items-center px-6 text-center">
              <span className="eco-avatar h-16 w-16 text-lg" style={{ boxShadow: '0 0 0 4px #fff, 0 10px 24px -8px rgba(27,94,32,0.5)' }}>
                {getInitials(orgName)}
              </span>
              <p className="mt-3 text-base font-extrabold">{orgName}</p>
              <span className={`eco-badge ${status.badge} mt-1.5`}>{status.label}</span>
            </div>

            {details.isSuspended && (
              <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                <p className="font-bold">Suspended on {formatShortDate(details.suspendedAt)}</p>
                <p className="mt-0.5 [overflow-wrap:anywhere]">{details.suspendedReason}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 p-6 text-xs">
              {[
                { label: 'Contact person', value: details.name },
                { label: 'Phone number', value: details.phone || '—' },
                { label: 'Email address', value: details.email, wide: true },
                { label: 'Registered', value: formatShortDate(details.createdAt) },
                { label: 'Reviewed', value: formatShortDate(details.reviewedAt) },
              ].map(({ label, value, wide }) => (
                <div key={label} className={`rounded-xl border border-eco-100 bg-eco-50/50 px-3 py-2.5 ${wide ? 'col-span-2' : ''}`}>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                  <p className="mt-0.5 truncate font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 px-6 sm:grid-cols-4">
              {[
                ['Activities', details.totals.activities],
                ['Volunteers joined', details.totals.volunteersJoined],
                ['Attended', details.totals.volunteersAttended],
                ['Certificates', details.totals.certificatesIssued],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-eco-100 bg-white px-3 py-2.5 text-center">
                  <p className="text-lg font-extrabold text-eco-700">{value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="px-6 pt-6">
              <h4 className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-eco-700">Verification documents</h4>
              {details.documents.length === 0 ? (
                <p className="text-xs text-slate-400">No documents uploaded.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {details.documents.map((doc) => (
                    <button key={doc._id} type="button" onClick={() => openDocument(doc)} className="eco-btn eco-btn-secondary eco-btn-sm max-w-full">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{doc.originalName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-6">
              <h4 className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-eco-700">Activities ({details.activities.length})</h4>
              {details.activities.length === 0 ? (
                <p className="text-xs text-slate-400">No activities posted yet.</p>
              ) : (
                <ul className="eco-scroll max-h-56 divide-y divide-eco-100 overflow-y-auto rounded-xl border border-eco-100">
                  {details.activities.map((a) => (
                    <li key={a._id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-700">{a.title}</p>
                        <p className="text-slate-500">{formatShortDate(a.date)} · {a.participantCount}/{a.volunteerLimit} volunteers</p>
                      </div>
                      {a.isHidden
                        ? <span className="eco-badge eco-badge-red shrink-0" title={a.hiddenReason}>Hidden</span>
                        : a.hiddenBySuspension
                          ? <span className="eco-badge eco-badge-gray shrink-0">Hidden (suspended)</span>
                          : <span className="eco-badge eco-badge-green shrink-0">Visible</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-eco-100 bg-white/95 px-6 py-4 backdrop-blur">
              <button type="button" onClick={() => onDelete(details)} className="eco-btn eco-btn-danger-soft mr-auto">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              {status.key === 'active' && (
                <button type="button" onClick={() => onSuspend(details)} className="eco-btn eco-btn-danger-soft">
                  <Ban className="h-4 w-4" /> Suspend
                </button>
              )}
              {status.key === 'suspended' && (
                <button type="button" onClick={() => onReactivate(details)} className="eco-btn eco-btn-secondary">
                  <RotateCcw className="h-4 w-4" /> Reactivate
                </button>
              )}
              <button type="button" onClick={onClose} className="eco-btn eco-btn-primary">Close</button>
            </div>
          </>
        )}
      </div>

      {preview && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setPreview(null)} />
          <div className="ecotask-modal-panel eco-modal relative z-10 flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden">
            <div className="eco-card-header">
              <p className="truncate text-sm font-bold">{preview.name}</p>
              <div className="flex items-center gap-2">
                <a href={preview.url} download={preview.name} className="eco-btn eco-btn-secondary eco-btn-sm">Download</a>
                <button type="button" onClick={() => setPreview(null)} aria-label="Close" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-3">
              {preview.type === 'application/pdf'
                ? <iframe title={preview.name} src={preview.url} className="h-full w-full rounded-lg bg-white" />
                : <img src={preview.url} alt={preview.name} className="max-h-full max-w-full rounded-lg object-contain shadow" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------
   Volunteers tab
   ------------------------------------------ */
function VolunteerManagementView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  // Suspension (same flow as organizers): reason required, can be undone.
  const [statusFilter, setStatusFilter] = useState('all');
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${adminInfo.token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load users');
        }

        setUsers(data.filter((user) => user.role === 'volunteer'));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const suspendedCount = users.filter((user) => user.isSuspended).length;
  const filteredUsers = users.filter((user) => (
    (statusFilter === 'all' || (statusFilter === 'suspended' ? user.isSuspended : !user.isSuspended)) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  // Apply the server's answer to the list (and the open details card).
  const applyVolunteer = (updated, message) => {
    const merge = (user) => (user._id === updated._id ? { ...user, ...updated } : user);
    setUsers((current) => current.map(merge));
    setSelectedUser((current) => (current ? merge(current) : current));
    setNotice(message);
    setSuspendTarget(null);
    setReactivateTarget(null);
  };

  const suspendVolunteer = async (reason) => {
    const data = await adminFetch(`/api/admin/volunteers/${suspendTarget._id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    applyVolunteer(data.volunteer, data.message);
  };

  const reactivateVolunteer = async () => {
    const data = await adminFetch(`/api/admin/volunteers/${reactivateTarget._id}/reactivate`, { method: 'PATCH' });
    applyVolunteer(data.volunteer, data.message);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const response = await fetch(`${API_BASE_URL}/api/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminInfo.token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete user');
      }

      setUsers((currentUsers) => currentUsers.filter((user) => user._id !== userToDelete._id));
      setUserToDelete(null);
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  if (loading) {
    return <div className="eco-card mx-auto h-96 max-w-6xl animate-pulse bg-white/70" />;
  }

  if (error) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>;
  }

  const formatJoined = (user) => (
    user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : (user.joined || '—')
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-800">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total volunteers" value={users.length} icon={Users} />
        <StatTile label="Active in activities" value={users.filter((user) => (user.activities || 0) > 0).length} icon={UserCheck} />
        <StatTile label="Not yet joined" value={users.filter((user) => !(user.activities > 0)).length} icon={UserX} />
        <StatTile label="Suspended" value={suspendedCount} icon={Ban} />
      </div>

      {notice && <div className="rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-sm font-semibold text-eco-800">{notice}</div>}

      <div className="eco-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-eco-100 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All', users.length],
              ['active', 'Active', users.length - suspendedCount],
              ['suspended', 'Suspended', suspendedCount],
            ].map(([key, label, count]) => (
              <button key={key} type="button" onClick={() => setStatusFilter(key)} className={`eco-chip ${statusFilter === key ? 'eco-chip-active' : ''}`}>
                {label} <span className="eco-chip-count">{count}</span>
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-2 rounded-xl border border-eco-100 bg-eco-50/50 px-3.5 py-2.5 text-slate-700 transition focus-within:border-eco-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-eco-200/40 sm:w-80">
            <Search className="h-4 w-4 text-eco-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="eco-scroll overflow-x-auto p-3">
          <table className="eco-table min-w-[760px]">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th>Activities</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="eco-avatar h-9 w-9 text-xs">{getInitials(user.name)}</span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800">{user.name}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600">{user.phone || '—'}</td>
                    <td><span className="eco-badge eco-badge-gray capitalize">{user.role}</span></td>
                    <td className="font-extrabold text-slate-800">{user.activities || 0}</td>
                    <td>
                      {user.isSuspended ? (
                        <span className="eco-badge eco-badge-red" title={user.suspendedReason}>Suspended</span>
                      ) : (
                        <span className="eco-badge eco-badge-green">
                          <span className="h-1.5 w-1.5 rounded-full bg-eco-500" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="eco-btn eco-btn-secondary eco-btn-sm"
                        >
                          View
                        </button>
                        {user.isSuspended ? (
                          <button type="button" onClick={() => setReactivateTarget(user)} className="eco-btn eco-btn-secondary eco-btn-sm">
                            Reactivate
                          </button>
                        ) : (
                          <button type="button" onClick={() => setSuspendTarget(user)} className="eco-btn eco-btn-danger-soft eco-btn-sm">
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => setUserToDelete(user)}
                          aria-label={`Delete ${user.name}`}
                          className="eco-btn eco-btn-danger-soft eco-btn-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    {statusFilter === 'suspended' && !searchTerm ? 'No suspended volunteers.' : 'No users found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW USER DETAILS MODAL */}
      {selectedUser && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />
          <div className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-md overflow-hidden">
            <div className="relative h-20 bg-gradient-to-r from-eco-700 via-eco-600 to-eco-400">
              <button
                onClick={() => setSelectedUser(null)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative z-10 -mt-9 flex flex-col items-center px-6 text-center">
              <span className="eco-avatar h-16 w-16 text-lg" style={{ boxShadow: '0 0 0 4px #fff, 0 10px 24px -8px rgba(27,94,32,0.5)' }}>
                {getInitials(selectedUser.name)}
              </span>
              <p className="mt-3 text-base font-extrabold text-slate-800">{selectedUser.name}</p>
              <span className={`eco-badge mt-1.5 ${selectedUser.isSuspended ? 'eco-badge-red' : 'eco-badge-green'}`}>
                {selectedUser.isSuspended ? 'Suspended' : 'Active'}
              </span>
            </div>

            {selectedUser.isSuspended && (
              <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                <p className="font-bold">Suspended on {formatShortDate(selectedUser.suspendedAt)}</p>
                <p className="mt-0.5 [overflow-wrap:anywhere]">{selectedUser.suspendedReason}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 p-6 text-xs">
              {[
                { label: 'Email Address', value: selectedUser.email, wide: true },
                { label: 'Phone Number', value: selectedUser.phone || '—' },
                { label: 'Role', value: selectedUser.role },
                { label: 'Joined', value: formatJoined(selectedUser) },
                { label: 'Activities Joined', value: selectedUser.activities || 0 },
              ].map(({ label, value, wide }) => (
                <div key={label} className={`rounded-xl border border-eco-100 bg-eco-50/50 px-3 py-2.5 ${wide ? 'col-span-2' : ''}`}>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                  <p className="mt-0.5 truncate font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-eco-100 px-6 py-4">
              {selectedUser.isSuspended ? (
                <button type="button" onClick={() => setReactivateTarget(selectedUser)} className="eco-btn eco-btn-secondary">
                  <RotateCcw className="h-4 w-4" /> Reactivate
                </button>
              ) : (
                <button type="button" onClick={() => setSuspendTarget(selectedUser)} className="eco-btn eco-btn-danger-soft">
                  <Ban className="h-4 w-4" /> Suspend
                </button>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="eco-btn eco-btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendTarget && (
        <ReasonModal
          title={`Suspend ${suspendTarget.name}?`}
          description="They won't be able to log in or join activities until you reactivate the account. Their activity history and certificates are kept."
          label="Reason"
          placeholder="e.g. Repeatedly registered and did not attend."
          confirmLabel="Suspend volunteer"
          danger
          required
          onConfirm={suspendVolunteer}
          onClose={() => setSuspendTarget(null)}
        />
      )}

      {reactivateTarget && (
        <ReasonModal
          title={`Reactivate ${reactivateTarget.name}?`}
          description="They can log in and join activities again."
          confirmLabel="Reactivate"
          onConfirm={reactivateVolunteer}
          onClose={() => setReactivateTarget(null)}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      {userToDelete && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
          <div className="absolute inset-0" onClick={() => setUserToDelete(null)} />
          <div className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-sm p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-extrabold text-slate-800">Delete user account?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              <span className="font-bold text-slate-800">{userToDelete.name}</span> will be removed permanently. This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="eco-btn eco-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="eco-btn eco-btn-danger"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   ANNOUNCEMENTS VIEW
   ========================================== */
// Announcement rules (match the backend in announcementController.js).
const ANNOUNCEMENT_CATEGORIES = ['Important', 'Organizer Updates', 'General'];
const TITLE_MAX = 100;
const MESSAGE_MAX = 2000;

// Category chips (shared by the post form and the edit card)
const CategoryPicker = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {ANNOUNCEMENT_CATEGORIES.map((category) => (
      <button
        key={category}
        type="button"
        onClick={() => onChange(category)}
        aria-pressed={value === category}
        className={`eco-chip px-3 py-1.5 text-xs ${value === category ? 'eco-chip-active' : ''}`}
      >
        {category}
      </button>
    ))}
  </div>
);

const CharCount = ({ value, max }) => (
  <span className={`text-[11px] font-semibold ${value.length > max ? 'text-rose-600' : 'text-slate-400'}`}>
    {value.length}/{max}
  </span>
);

function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const emptyForm = { title: '', category: 'General', description: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [posting, setPosting] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('info'); // 'success' | 'info'

  // Edit card: null when closed. `original` is used to know if anything changed.
  const [editing, setEditing] = useState(null);
  const [editOriginal, setEditOriginal] = useState(null);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation card.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const authHeaders = (json = false) => {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    return {
      ...(json && { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${adminInfo.token}`,
    };
  };

  const notify = (message, type = 'info') => {
    setNotification(message);
    setNotificationType(type);
  };

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/announcements`, { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load announcements');
        setAnnouncements(data);
      } catch (requestError) {
        notify(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => setFormData(emptyForm);

  const handlePost = async (e) => {
    e.preventDefault();
    if (formData.title.trim().length < 3 || formData.description.trim().length < 5) {
      notify('Please add a title (at least 3 characters) and a message (at least 5 characters).');
      return;
    }

    try {
      setPosting(true);
      const response = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category,
          description: formData.description.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to post announcement');
      setAnnouncements((current) => [data, ...current]);
      setFormData(emptyForm);
      notify('Announcement posted successfully!', 'success');
    } catch (requestError) {
      notify(requestError.message);
    } finally {
      setPosting(false);
    }
  };

  /* ---------- Delete (with confirmation) ---------- */
  const confirmDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError('');
      const response = await fetch(`${API_BASE_URL}/api/announcements/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to delete announcement');
      setAnnouncements((current) => current.filter((announcement) => announcement._id !== deleteTarget._id));
      setDeleteTarget(null);
      notify('Announcement deleted.', 'success');
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Edit ---------- */
  const handleEdit = (announcement) => {
    const category = ANNOUNCEMENT_CATEGORIES.find(
      (c) => c.toLowerCase() === String(announcement.category || '').toLowerCase()
    ) || 'General';
    const snapshot = {
      _id: announcement._id,
      title: announcement.title || '',
      category,
      description: announcement.description || announcement.message || '',
    };
    setEditError('');
    setEditing(snapshot);
    setEditOriginal({ ...snapshot, category: announcement.category || '' });
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditing(null);
    setEditOriginal(null);
    setEditError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
    setEditError('');
  };

  const editHasChanges = editing && editOriginal && (
    editing.title.trim() !== editOriginal.title
    || editing.category !== editOriginal.category
    || editing.description.trim() !== editOriginal.description
  );

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editHasChanges) return;
    const title = editing.title.trim();
    const description = editing.description.trim();
    if (title.length < 3 || description.length < 5) {
      setEditError('Please add a title (at least 3 characters) and a message (at least 5 characters).');
      return;
    }

    try {
      setSavingEdit(true);
      const response = await fetch(`${API_BASE_URL}/api/announcements/${editing._id}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ title, category: editing.category, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to edit announcement');
      setAnnouncements((current) => current.map((item) => item._id === data._id ? data : item));
      setEditing(null);
      setEditOriginal(null);
      notify('Announcement updated.', 'success');
    } catch (requestError) {
      setEditError(requestError.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="eco-card mx-auto h-96 max-w-6xl animate-pulse bg-white/70" />;

  const isSuccess = notificationType === 'success';

  return (
    <>
    <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 text-slate-800 lg:grid-cols-12">
      {/* Creation Card */}
      <div className="eco-card overflow-hidden lg:sticky lg:top-0 lg:col-span-5">
        <CardTitle icon={Megaphone}>New Announcement</CardTitle>

        <div className="p-5">
          {notification && (
            <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
              isSuccess ? 'border-eco-200 bg-eco-50 text-eco-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              {isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Bell className="h-4 w-4 shrink-0" />}
              <span className="flex-1">{notification}</span>
              <button type="button" onClick={() => setNotification('')} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="eco-label">Title</label>
                <CharCount value={formData.title} max={TITLE_MAX} />
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={TITLE_MAX}
                placeholder="e.g. Change in Assembly Point"
                className="eco-input"
              />
            </div>
            <div>
              <label className="eco-label">Category</label>
              <CategoryPicker value={formData.category} onChange={(category) => setFormData((prev) => ({ ...prev, category }))} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="eco-label">Message</label>
                <CharCount value={formData.description} max={MESSAGE_MAX} />
              </div>
              <textarea
                rows={5}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={MESSAGE_MAX}
                placeholder="Type your announcement here..."
                className="eco-input resize-y"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-eco-100 bg-eco-50/40 px-5 py-4">
          <button type="button" onClick={handleClear} disabled={posting} className="eco-btn eco-btn-danger-soft">
            Clear
          </button>
          <button type="button" onClick={handlePost} disabled={posting} className="eco-btn eco-btn-primary">
            <Megaphone className="h-4 w-4" /> {posting ? 'Posting...' : 'Post announcement'}
          </button>
        </div>
      </div>

      {/* History Card */}
      <div className="eco-card overflow-hidden lg:col-span-7">
        <CardTitle
          icon={Clock}
          right={<span className="eco-badge eco-badge-green">{announcements.length} posts</span>}
        >
          Posted Announcements
        </CardTitle>

        <div className="eco-scroll max-h-[620px] space-y-3 overflow-y-auto p-4">
          {announcements.length > 0 ? (
            announcements.map((item) => {
              const category = (item.category || '').toUpperCase();
              const tone = category === 'IMPORTANT' ? 'red' : category === 'ORGANIZER UPDATES' ? 'blue' : 'green';
              const bar = { red: 'from-red-300 to-red-500', blue: 'from-sky-300 to-sky-600', green: 'from-eco-400 to-eco-700' }[tone];
              return (
                <article
                  key={item._id || item.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white py-4 pl-5 pr-4 shadow-sm transition hover:border-eco-200 hover:shadow-md"
                >
                  <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${bar}`} />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slate-800 [overflow-wrap:anywhere]">{item.title}</h4>
                    {item.category && (
                      <span className={`eco-badge ${tone === 'red' ? 'eco-badge-red' : tone === 'blue' ? 'eco-badge-blue' : 'eco-badge-green'}`}>
                        {item.category}
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {item.author?.name || 'Admin'} • {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently'}
                    {item.editedAt && (
                      <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500" title={new Date(item.editedAt).toLocaleString()}>
                        Edited · {new Date(item.editedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                    {item.description}
                  </p>

                  <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2.5">
                    <button onClick={() => handleEdit(item)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-eco-50 hover:text-eco-800">
                      <Edit3 className="h-3.5 w-3.5 text-eco-600" /> Edit
                    </button>
                    <button
                      onClick={() => { setDeleteError(''); setDeleteTarget(item); }}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="eco-empty py-12">
              <Megaphone className="h-6 w-6 text-eco-400" />
              No announcements posted yet.
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Edit Announcement Card */}
    {editing && (
      <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 text-slate-800">
        <div className="absolute inset-0" onClick={closeEdit} />
        <form
          onSubmit={handleSaveEdit}
          className="ecotask-modal-panel eco-modal eco-scroll relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-eco-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-eco-50 text-eco-700">
                <Edit3 className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Edit Announcement</h3>
            </div>
            <button type="button" onClick={closeEdit} aria-label="Close" className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            {editError && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                <Bell className="h-4 w-4 shrink-0" />
                {editError}
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <label className="eco-label">Title</label>
                <CharCount value={editing.title} max={TITLE_MAX} />
              </div>
              <input
                type="text"
                name="title"
                value={editing.title}
                onChange={handleEditChange}
                maxLength={TITLE_MAX}
                className="eco-input"
                autoFocus
              />
            </div>
            <div>
              <label className="eco-label">Category</label>
              <CategoryPicker value={editing.category} onChange={(category) => { setEditing((prev) => ({ ...prev, category })); setEditError(''); }} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="eco-label">Message</label>
                <CharCount value={editing.description} max={MESSAGE_MAX} />
              </div>
              <textarea
                rows={6}
                name="description"
                value={editing.description}
                onChange={handleEditChange}
                maxLength={MESSAGE_MAX}
                className="eco-input resize-y"
              />
            </div>
            <p className="text-[11px] text-slate-400">Volunteers will see an "Edited" label on this announcement.</p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-eco-100 bg-eco-50/40 px-5 py-4">
            {!editHasChanges && <span className="mr-auto text-[11px] font-semibold text-slate-400">No changes yet</span>}
            <button type="button" onClick={closeEdit} disabled={savingEdit} className="eco-btn eco-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={savingEdit || !editHasChanges} className="eco-btn eco-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" /> {savingEdit ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    )}

    {/* Delete Confirmation Card */}
    {deleteTarget && (
      <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4 text-slate-800">
        <div className="absolute inset-0" onClick={() => !deleting && setDeleteTarget(null)} />
        <div className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-sm p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-base font-extrabold">Delete this announcement?</h3>
          <p className="mt-1.5 text-sm text-slate-600">
            <span className="font-semibold text-slate-800 [overflow-wrap:anywhere]">"{deleteTarget.title}"</span> will be removed for everyone. This can't be undone.
          </p>
          {deleteError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{deleteError}</p>}
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="eco-btn eco-btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={deleting} className="eco-btn eco-btn-danger">
              <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/* ==========================================
   ACCOUNT SETTINGS VIEW
   ========================================== */
const SETTINGS_NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/;
const SETTINGS_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'One special character', test: (v) => /[^A-Za-z\d]/.test(v) },
];
const STRENGTH_LEVELS = [
  { label: '', color: 'bg-slate-200', text: 'text-slate-400' },
  { label: 'Very weak', color: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Fair', color: 'bg-yellow-500', text: 'text-yellow-600' },
  { label: 'Good', color: 'bg-lime-500', text: 'text-lime-600' },
  { label: 'Strong', color: 'bg-eco-600', text: 'text-eco-700' },
];

const validateSettingsName = (value) => {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return 'Full name is required.';
  if (name.length < 2 || name.length > 50) return 'Full name must be 2 to 50 characters.';
  if (!SETTINGS_NAME_PATTERN.test(name)) return 'Only letters, spaces, periods, hyphens, and apostrophes are allowed.';
  if ((name.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length < 2) return 'Full name must contain at least 2 letters.';
  return '';
};
const validateSettingsEmail = (value) => {
  const email = value.trim();
  if (!email) return 'Email address is required.';
  if (email.length > 100) return 'Email address is too long.';
  if (!SETTINGS_EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.';
  return '';
};

const settingsInputState = (error) => (error ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgb(254_205_211/0.6)]' : '');

function SettingsFieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p>;
}

function PasswordStrength({ password }) {
  const metCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const level = password ? STRENGTH_LEVELS[metCount] : STRENGTH_LEVELS[0];
  return (
    <div className="mt-2 rounded-xl bg-eco-50/60 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {PASSWORD_RULES.map((rule, index) => (
            <div key={rule.key} className={`h-1.5 flex-1 rounded-full transition-colors ${password && index < metCount ? level.color : 'bg-slate-200'}`} />
          ))}
        </div>
        <span className={`w-16 text-right text-[11px] font-semibold ${level.text}`}>{level.label}</span>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.key} className={`flex items-center gap-1.5 text-[11px] ${met ? 'text-eco-700' : 'text-slate-500'}`}>
              {met ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PasswordInput({ name, value, onChange, error, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={64}
        className={`eco-input pr-11 ${settingsInputState(error)}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-eco-50 hover:text-eco-700"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SettingsNotice({ notice }) {
  if (!notice) return null;
  const styles = {
    success: 'text-eco-700',
    error: 'text-rose-600',
    info: 'text-slate-500',
  };
  return (
    <p className={`mr-auto flex items-center gap-1.5 text-xs font-semibold ${styles[notice.type]}`}>
      {notice.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
      {notice.type === 'error' && <X className="h-4 w-4" />}
      {notice.text}
    </p>
  );
}


const formatSettingsDate = (value) => (
  value ? new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Never'
);

function SettingsView({ onProfileChange, onSessionEnded }) {
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState('');

  // Profile form. Locked until the admin confirms their current password.
  // Only the name can change; the login email is fixed.
  const [profile, setProfile] = useState({ name: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileNotice, setProfileNotice] = useState(null); // { type, text }
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileUnlocked, setProfileUnlocked] = useState(false);
  const [verifiedPassword, setVerifiedPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPasswordInput] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Password form
  const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Sessions
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [sessionNotice, setSessionNotice] = useState('');

  // Any 401 means this session was ended (e.g. password changed on another device)
  const request = async (path, options) => {
    try {
      return await adminFetch(path, options);
    } catch (error) {
      if (/session has ended|invalid or expired token|not authorized/i.test(error.message)) onSessionEnded?.();
      throw error;
    }
  };

  // The server returns a new token after a password change / log out everywhere
  const saveSession = (data) => {
    const current = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const updated = { ...current, ...data };
    localStorage.setItem('adminInfo', JSON.stringify(updated));
    setAccount((prev) => ({ ...prev, ...data }));
    onProfileChange?.(updated);
  };

  useEffect(() => {
    request('/api/auth/me')
      .then((data) => {
        setAccount(data);
        setProfile({ name: data.name || '' });
      })
      .catch((error) => setLoadError(error.message));
  }, []); // load once

  const profileChanged = account && profile.name.trim().replace(/\s+/g, ' ') !== account.name;

  const openConfirm = () => {
    setProfileNotice(null);
    setConfirmPasswordInput('');
    setConfirmError('');
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    if (confirming) return;
    setShowConfirm(false);
    setConfirmPasswordInput('');
    setConfirmError('');
  };

  // Step 1: check the current password with the server, then unlock the name field.
  const confirmIdentity = async (e) => {
    e.preventDefault();
    if (!confirmPassword) {
      setConfirmError('Enter your current password.');
      return;
    }
    setConfirming(true);
    setConfirmError('');
    try {
      await request('/api/users/me/verify-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: confirmPassword }),
      });
      setVerifiedPassword(confirmPassword);
      setProfile({ name: account.name || '' });
      setProfileErrors({});
      setProfileUnlocked(true);
      setShowConfirm(false);
      setConfirmPasswordInput('');
    } catch (error) {
      setConfirmError(error.message);
    } finally {
      setConfirming(false);
    }
  };

  const lockProfile = () => {
    setProfileUnlocked(false);
    setVerifiedPassword('');
    setProfile({ name: account.name || '' });
    setProfileErrors({});
  };

  const handleProfileChange = (e) => {
    const { value } = e.target;
    setProfile({ name: value });
    setProfileNotice(null);
    setProfileErrors({ name: validateSettingsName(value) });
  };

  // Step 2: save. The server checks the same password again.
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileChanged) return;
    const nameError = validateSettingsName(profile.name);
    setProfileErrors({ name: nameError });
    if (nameError) return;

    setSavingProfile(true);
    try {
      const data = await request('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: profile.name, currentPassword: verifiedPassword }),
      });
      saveSession(data.user);
      setProfile({ name: data.user.name });
      setProfileUnlocked(false);
      setVerifiedPassword('');
      setProfileNotice({ type: 'success', text: data.message });
    } catch (error) {
      if (/current password/i.test(error.message)) {
        lockProfile();
        setProfileNotice({ type: 'error', text: 'Please confirm your password again to edit your profile.' });
      } else {
        setProfileNotice({ type: 'error', text: error.message });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    const next = { ...passwords, [name]: value };
    setPasswords(next);
    setPasswordNotice(null);
    setPasswordErrors((prev) => ({
      ...prev,
      [name]: '',
      ...(next.confirmPassword && (name === 'newPassword' || name === 'confirmPassword')
        ? { confirmPassword: next.newPassword === next.confirmPassword ? '' : 'Passwords do not match.' }
        : {}),
    }));
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const failed = PASSWORD_RULES.find((rule) => !rule.test(passwords.newPassword));
    const errors = {
      currentPassword: passwords.currentPassword ? '' : 'Current password is required.',
      newPassword: !passwords.newPassword
        ? 'New password is required.'
        : failed ? `Password needs: ${failed.label.toLowerCase()}.` : '',
      confirmPassword: passwords.confirmPassword !== passwords.newPassword || !passwords.confirmPassword ? 'Passwords do not match.' : '',
    };
    if (!errors.newPassword && passwords.newPassword === passwords.currentPassword) {
      errors.newPassword = 'New password must be different from the current one.';
    }
    setPasswordErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSavingPassword(true);
    try {
      const data = await request('/api/auth/me/password', { method: 'PUT', body: JSON.stringify(passwords) });
      const { message, ...session } = data;
      saveSession(session);
      setPasswords(emptyPasswords);
      setPasswordNotice({ type: 'success', text: message });
    } catch (error) {
      setPasswordNotice({ type: 'error', text: error.message });
      if (/current password/i.test(error.message)) setPasswordErrors((prev) => ({ ...prev, currentPassword: 'Current password is incorrect.' }));
    } finally {
      setSavingPassword(false);
    }
  };

  const logoutAll = async () => {
    const data = await request('/api/auth/me/logout-all', { method: 'POST' });
    const { message, ...session } = data;
    saveSession(session);
    setSessionNotice(message);
    setConfirmLogoutAll(false);
  };

  if (loadError) {
    return <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{loadError}</div>;
  }
  if (!account) return <div className="eco-card mx-auto h-96 max-w-3xl animate-pulse bg-white/70" />;

  return (
    <div className="mx-auto max-w-3xl space-y-5 text-slate-800">
      {/* 3. ACCOUNT INFO */}
      <div className="eco-card overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-eco-700 via-eco-600 to-eco-400" />
        <div className="relative z-10 -mt-8 flex flex-wrap items-start gap-x-4 gap-y-2 px-6">
          <span className="eco-avatar h-16 w-16 text-lg" style={{ boxShadow: '0 0 0 4px #fff, 0 10px 24px -8px rgba(27,94,32,0.5)' }}>
            {getInitials(account.name)}
          </span>
          <div className="min-w-0 pt-9">
            <p className="truncate text-lg font-extrabold">{account.name}</p>
            <p className="truncate text-xs text-slate-500">{account.email}</p>
          </div>
          <span className="eco-badge eco-badge-green ml-auto mt-10"><ShieldCheck className="h-3 w-3" /> Administrator</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 p-6 text-xs sm:grid-cols-3">
          {[
            ['Role', 'Administrator'],
            ['Member since', formatSettingsDate(account.createdAt)],
            ['Password last changed', formatSettingsDate(account.passwordChangedAt)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-eco-100 bg-eco-50/50 px-3 py-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              <p className="mt-0.5 font-semibold text-slate-700">{value}</p>
            </div>
          ))}
        </div>
        {!account.passwordChangedAt && (
          <p className="mx-6 mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            You are still using the default password. Please change it below.
          </p>
        )}
      </div>

      {/* 2. EDIT PROFILE (locked until the current password is confirmed) */}
      <form onSubmit={saveProfile} noValidate className="eco-card overflow-hidden">
        <CardTitle icon={User}>Profile</CardTitle>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="eco-label">Full name</label>
              <input
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                disabled={!profileUnlocked}
                maxLength={50}
                autoComplete="name"
                className={`eco-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${settingsInputState(profileErrors.name)}`}
              />
              <SettingsFieldError message={profileErrors.name} />
            </div>
            <div>
              <label className="eco-label">Email address</label>
              <input
                type="email"
                value={account.email || ''}
                disabled
                className="eco-input cursor-not-allowed bg-slate-100 text-slate-500"
              />
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="h-3 w-3" /> Your login email can't be changed.
              </p>
            </div>
          </div>

          {!profileUnlocked && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-eco-200 bg-eco-50/40 px-4 py-3">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">Profile is locked.</span> Confirm your password to edit your name.
              </p>
              <button type="button" onClick={openConfirm} className="eco-btn eco-btn-primary eco-btn-sm">
                <Edit3 className="h-3.5 w-3.5" /> Edit profile
              </button>
            </div>
          )}
          {!profileUnlocked && profileNotice && (
            <div className="mt-3"><SettingsNotice notice={profileNotice} /></div>
          )}
        </div>

        {profileUnlocked && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-eco-100 bg-eco-50/40 px-6 py-4">
            {!profileChanged && <span className="mr-auto text-[11px] font-semibold text-slate-400">No changes yet</span>}
            {profileChanged && <SettingsNotice notice={profileNotice} />}
            <button type="button" onClick={lockProfile} disabled={savingProfile} className="eco-btn eco-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={savingProfile || !profileChanged} className="eco-btn eco-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
              {savingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        )}
      </form>

      {showConfirm && (
        <div className="ecotask-modal-backdrop eco-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 text-slate-800">
          <div className="absolute inset-0" onClick={closeConfirm} />
          <form onSubmit={confirmIdentity} noValidate className="ecotask-modal-panel eco-modal relative z-10 w-full max-w-sm p-6">
            <span className="eco-icon-tile mx-auto h-12 w-12 rounded-2xl"><Lock className="h-5 w-5" /></span>
            <h3 className="mt-4 text-center text-base font-extrabold">Confirm it's you</h3>
            <p className="mt-1.5 text-center text-sm text-slate-600">Enter your current password to edit your profile.</p>
            <div className="mt-5">
              <label className="eco-label">Current password</label>
              <PasswordInput
                name="confirmCurrentPassword"
                value={confirmPassword}
                onChange={(e) => { setConfirmPasswordInput(e.target.value); setConfirmError(''); }}
                error={confirmError}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
              <SettingsFieldError message={confirmError} />
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={closeConfirm} disabled={confirming} className="eco-btn eco-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={confirming} className="eco-btn eco-btn-primary">
                {confirming ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 1. CHANGE PASSWORD */}
      <form onSubmit={savePassword} noValidate className="eco-card overflow-hidden">
        <CardTitle icon={Lock}>Change password</CardTitle>
        <div className="space-y-4 p-6">
          <div className="max-w-sm">
            <label className="eco-label">Current password</label>
            <PasswordInput name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} error={passwordErrors.currentPassword} autoComplete="current-password" />
            <SettingsFieldError message={passwordErrors.currentPassword} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="eco-label">New password</label>
              <PasswordInput name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} error={passwordErrors.newPassword} autoComplete="new-password" />
              <SettingsFieldError message={passwordErrors.newPassword} />
            </div>
            <div>
              <label className="eco-label">Confirm new password</label>
              <PasswordInput name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} error={passwordErrors.confirmPassword} autoComplete="new-password" />
              <SettingsFieldError message={passwordErrors.confirmPassword} />
            </div>
          </div>
          {passwords.newPassword && <PasswordStrength password={passwords.newPassword} />}
          <p className="text-[11px] text-slate-500">Changing your password logs you out on every other device.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-eco-100 bg-eco-50/40 px-6 py-4">
          <SettingsNotice notice={passwordNotice} />
          <button type="submit" disabled={savingPassword} className="eco-btn eco-btn-primary">
            {savingPassword ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>

      {/* 4. SESSIONS */}
      <div className="eco-card overflow-hidden">
        <CardTitle icon={LogOut}>Sessions</CardTitle>
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="max-w-md">
            <p className="text-sm font-bold text-slate-700">Log out of all other devices</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Use this if you logged in on a shared or lost computer. You'll stay logged in here.
            </p>
            {sessionNotice && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-eco-700"><CheckCircle2 className="h-4 w-4" />{sessionNotice}</p>}
          </div>
          <button type="button" onClick={() => setConfirmLogoutAll(true)} className="eco-btn eco-btn-danger-soft">
            <LogOut className="h-4 w-4" /> Log out other devices
          </button>
        </div>
      </div>

      {confirmLogoutAll && (
        <ReasonModal
          title="Log out of all other devices?"
          description="Every other browser or computer using this admin account will need to log in again."
          confirmLabel="Log out other devices"
          danger
          onConfirm={logoutAll}
          onClose={() => setConfirmLogoutAll(false)}
        />
      )}
    </div>
  );
}
