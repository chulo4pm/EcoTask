import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useEffect, useState } from "react";
import volunteer from "./assets/voluteer.jpg";
import { API_BASE_URL } from "./config";


/* =========================================================
   ECOTASK LOGO
========================================================= */

function EcoTaskLogo() {
  return (
    <div className="flex items-center font-black tracking-tight">

      {/* EC */}
      <span className="text-[24px] text-[#1f5133]">
        Ec
      </span>

      {/* CIRCLE + ARROW */}
      <div className="mx-[2px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-[#4ade80] bg-[#075f2b]">

        <svg
          width="18"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arrow Up */}
          <path
            d="M12 19V5"
            stroke="#86EFAC"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M6.5 10.5L12 5L17.5 10.5"
            stroke="#86EFAC"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

      </div>

      {/* TASK */}
      <span className="text-[24px] text-[#1f5133]">
        Task
      </span>

    </div>
  );
}


/* =========================================================
   RATE-LIMIT LOCK (same as the volunteer and organizer logins)
   The server blocks too many failed logins (HTTP 429). We
   remember when the block ends so the button stays disabled
   after a refresh. The server is what enforces the limit.
========================================================= */

const LOCK_KEY = "ecotaskLoginLockedUntil";
const DEFAULT_LOCK_SECONDS = 15 * 60;

const readLock = () => {
  try {
    const value = Number(localStorage.getItem(LOCK_KEY));
    return value > Date.now() ? value : 0;
  } catch {
    return 0;
  }
};

const saveLock = (until) => {
  try {
    if (until) localStorage.setItem(LOCK_KEY, String(until));
    else localStorage.removeItem(LOCK_KEY);
  } catch {
    // storage unavailable (private mode) - the in-memory lock still works
  }
};

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};


/* =========================================================
   ADMIN LOGIN
========================================================= */

function AdminLogin({ onBack, onAdminLogin, onForgotPassword }) {

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(readLock);
  const [now, setNow] = useState(() => Date.now());

  const isLocked = lockedUntil > now;
  const remainingMs = lockedUntil - now;

  // Tick every second while locked, then unlock automatically.
  useEffect(() => {
    if (!lockedUntil) return undefined;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) {
        setLockedUntil(0);
        saveLock(0);
        setError("");
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);


  const handleSubmit = async (e) => {

    e.preventDefault();

    if (isLocked || submitting) return;

    const form = e.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get('admin-email') || '').trim().toLowerCase();
    const password = String(formData.get('admin-password') || '');

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server error: ${text.substring(0, 50)}...`);
      }

      // Too many attempts: lock the form until the server's block ends.
      if (res.status === 429) {
        const seconds = Number(data.retryAfter) || DEFAULT_LOCK_SECONDS;
        const until = Date.now() + seconds * 1000;
        setNow(Date.now());
        setLockedUntil(until);
        saveLock(until);
        setError(data.message || 'Too many login attempts. Please try again later.');
        return;
      }

      if (!res.ok) throw new Error(data.message || 'Login failed');

      saveLock(0);

      if (data.role !== 'admin') {
        throw new Error('Access denied. This account is not an admin.');
      }

      localStorage.setItem('adminInfo', JSON.stringify(data));
      onAdminLogin();
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Can't reach the server. Please check your connection and try again."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }

  };


  return (

    <div className="min-h-screen !bg-[#315d42] flex items-center justify-center p-4">


      {/* =================================================
          MAIN LOGIN CONTAINER
      ================================================= */}

      <div className="relative w-full max-w-[1200px] min-h-[670px] !bg-white rounded-[28px] overflow-hidden shadow-2xl flex">


        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="relative hidden md:flex w-1/2 overflow-hidden">


          {/* BACKGROUND IMAGE */}

          <img
            src={volunteer}
            alt="Volunteers helping the environment"
            className="absolute inset-0 w-full h-full object-cover"
          />


          {/* GREEN OVERLAY */}

          <div className="absolute inset-0 bg-[#008c36]/80"></div>


          {/* DARK OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-b from-[#005f28]/60 to-[#009b3d]/50"></div>


          {/* =================================================
              BACK BUTTON
          ================================================= */}

          <button
            onClick={onBack}
            className="
              absolute
              top-6
              left-6
              z-20
              w-11
              h-11
              rounded-full
              bg-white/15
              hover:bg-white/25
              border
              border-white/30
              !text-white
              flex
              items-center
              justify-center
              transition
              backdrop-blur-sm
            "
            aria-label="Back"
          >

            <ArrowLeft size={20} />

          </button>


          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <div className="relative z-10 flex items-center w-full px-16">


            <div className="max-w-[430px] !text-white">


              {/* ADMIN PORTAL */}

              <div className="flex items-center gap-3 mb-5">

                <ShieldCheck
                  size={32}
                  className="!text-white"
                />

                <span className="!text-sm font-bold uppercase tracking-[0.2em] !text-white">

                  Admin Portal

                </span>

              </div>


              {/* WELCOME */}

              <h2 className="!text-4xl font-bold tracking-wide mb-3 !text-white">

                WELCOME

              </h2>


              {/* TO ECOTASK */}

              <div className="flex items-center gap-2 mb-6">

                <div className="w-24 h-[2px] !bg-white"></div>

                <span className="!text-2xl font-medium !text-white">

                  To EcoTask

                </span>

              </div>


              {/* DESCRIPTION */}

              <p className="!text-base leading-8 !text-white font-medium">

                Manage environmental activities, volunteers,
                announcements, and EcoTask operations from
                the administrator dashboard.

              </p>


            </div>


          </div>


        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="w-full md:w-1/2 !bg-white flex items-center justify-center px-8 sm:px-12 lg:px-20 py-12">


          <div className="w-full max-w-[500px]">


            {/* =================================================
                MOBILE BACK
            ================================================= */}

            <button
              onClick={onBack}
              className="
                md:hidden
                mb-6
                w-10
                h-10
                rounded-full
                !bg-[#159447]
                !text-white
                flex
                items-center
                justify-center
              "
            >

              <ArrowLeft size={18} />

            </button>


            {/* =================================================
                ECOTASK LOGO
            ================================================= */}

            <div className="flex justify-center mb-5">

              <EcoTaskLogo />

            </div>


            {/* =================================================
                ADMIN LABEL
            ================================================= */}

            <div className="flex items-center justify-center gap-2 mb-4">


              <ShieldCheck
                size={18}
                strokeWidth={2.5}
                className="!text-[#159447]"
              />


              <span className="!text-sm font-bold tracking-wide !text-[#267044]">

                ADMIN PORTAL

              </span>


            </div>


            {/* =================================================
                TITLE
            ================================================= */}

            <h1 className="text-center !text-4xl font-extrabold !text-[#18241d] mb-3">

              Admin Login

            </h1>


            <p className="text-center !text-[#5f6d63] !text-sm font-medium mb-9">

              Login to access the EcoTask administrator dashboard.

            </p>


            {/* =================================================
                FORM
            ================================================= */}

            <form onSubmit={handleSubmit}>

              {/* ERROR / LOCKED MESSAGE */}

              {isLocked ? (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-md border border-amber-200 !bg-amber-50 px-4 py-3 !text-sm !text-amber-900"
                >
                  <Clock size={18} className="mt-0.5 shrink-0 !text-amber-600" />
                  <div>
                    <p className="font-semibold">Too many login attempts</p>
                    <p className="mt-0.5 !text-amber-800">
                      For your security, sign-in is paused.
                    </p>
                  </div>
                </div>
              ) : error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2 rounded-md border border-red-200 !bg-red-50 px-4 py-3 !text-sm font-medium !text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}


              {/* EMAIL */}

              <label
                htmlFor="admin-email"
                className="block !text-sm font-bold !text-[#27352c] mb-2"
              >

                Email address

              </label>


              <div className="relative mb-5">


                <Mail
                  size={19}
                  strokeWidth={2.3}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    !text-[#52705e]
                  "
                />


                <input
                  id="admin-email"
                  name="admin-email"
                  type="email"
                  placeholder="Admin email address"
                  required
                  className="
                    w-full
                    h-14
                    pl-12
                    pr-4
                    border-2
                    border-[#d5e1d8]
                    !bg-white
                    rounded-lg
                    outline-none
                    !text-[#26342b]
                    font-medium
                    placeholder:!text-[#6b7280]
                    shadow-sm
                    focus:border-[#159447]
                    focus:ring-4
                    focus:ring-[#159447]/15
                    transition
                  "
                />


              </div>


              {/* PASSWORD */}

              <label
                htmlFor="admin-password"
                className="block !text-sm font-bold !text-[#27352c] mb-2"
              >

                Password

              </label>


              <div className="relative mb-8">


                <Lock
                  size={19}
                  strokeWidth={2.3}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    !text-[#52705e]
                  "
                />


                <input
                  id="admin-password"
                  name="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="
                    w-full
                    h-14
                    pl-12
                    pr-12
                    border-2
                    border-[#d5e1d8]
                    !bg-white
                    rounded-lg
                    outline-none
                    !text-[#26342b]
                    font-medium
                    placeholder:!text-[#6b7280]
                    shadow-sm
                    focus:border-[#159447]
                    focus:ring-4
                    focus:ring-[#159447]/15
                    transition
                  "
                />


                {/* SHOW PASSWORD */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    !text-[#52705e]
                    hover:!text-[#159447]
                    transition
                  "
                  aria-label="Toggle password visibility"
                >

                  {showPassword ? (

                    <EyeOff size={19} />

                  ) : (

                    <Eye size={19} />

                  )}

                </button>


              </div>


              {/* FORGOT PASSWORD */}

              {onForgotPassword && (
                <div className="-mt-2 mb-5 flex justify-end">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm font-semibold !text-[#159447] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}


              {/* =================================================
                  LOGIN BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={isLocked || submitting}
                aria-busy={submitting}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  w-full
                  h-14
                  !bg-[#159447]
                  hover:!bg-[#0d7d39]
                  !text-white
                  font-bold
                  rounded-lg
                  transition
                  shadow-md
                  hover:shadow-lg
                  disabled:cursor-not-allowed
                  disabled:!bg-[#8fc9a3]
                  disabled:shadow-none
                "
              >

                {isLocked
                  ? `Try again in ${formatCountdown(remainingMs)}`
                  : submitting
                    ? (<><Loader2 size={18} className="animate-spin" /> Signing in...</>)
                    : "Login as Admin"}

              </button>


            </form>


            {/* =================================================
                BACK
            ================================================= */}

            <p className="text-center !text-sm !text-[#68746c] font-medium mt-6">


              Not an administrator?{" "}


              <button
                type="button"
                onClick={onBack}
                className="
                  !text-[#147a3b]
                  font-bold
                  hover:underline
                "
              >

                Back to EcoTask

              </button>


            </p>


          </div>


        </div>


      </div>


    </div>

  );
}


export default AdminLogin;