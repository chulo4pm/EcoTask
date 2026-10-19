import {
  AlertCircle,
  Building2,
  ArrowLeft,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import { useEffect, useState } from "react";


/* =========================================================
   RATE-LIMIT LOCK
   The server blocks too many failed logins (HTTP 429).
   We remember when the block ends so the button stays
   disabled even after a page refresh. The SERVER is what
   actually enforces the limit; this is only for the UI.
========================================================= */

const LOCK_KEY = "ecotaskOrganizerLoginLockedUntil";
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
import volunteer from "./assets/voluteer.jpg";
import VerifyEmail from "./VerifyEmail";
import { API_BASE_URL } from "./config";


/* =========================================================
   ECOTASK LOGO
========================================================= */

function EcoTaskLogo() {
  return (
    <div className="flex items-center font-black tracking-tight">

      <span className="text-[24px] text-[#1f5133]">
        Ec
      </span>

      <div className="mx-[2px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-[#4ade80] bg-[#075f2b]">

        <svg
          width="18"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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

      <span className="text-[24px] text-[#1f5133]">
        Task
      </span>

    </div>
  );
}


/* =========================================================
   LOGIN
========================================================= */

function OrganizerLogin({
  onBack,
  onRegister,
  onLogin,
  onForgotPassword,
}) {

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // Set when the account exists but the email isn't verified yet.
  const [verification, setVerification] = useState(null);
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
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');

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
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
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

      // Correct password but email not confirmed yet: show the code screen.
      if (res.status === 403 && data.needsVerification) {
        saveLock(0);
        setVerification(data);
        return;
      }

      if (!res.ok) throw new Error(data.message || 'Login failed');

      saveLock(0);

      if (data.role !== 'organizer') {
        setError('This is not an organizer account. Volunteers and admins have their own login pages.');
        return;
      }

      // Pending / rejected organizers can still log in to see their status.
      localStorage.setItem('organizerInfo', JSON.stringify(data));
      onLogin();
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


  // Code verified: the server returns the same data as a normal login.
  const handleVerified = (data) => {
    setVerification(null);
    if (!data.token) {
      setError(data.message || 'Your email is verified. Please sign in.');
      return;
    }
    if (data.role !== 'organizer') {
      setError('Your email is verified. This is not an organizer account, so please use the matching login page.');
      return;
    }
    localStorage.setItem('organizerInfo', JSON.stringify(data));
    onLogin();
  };


  if (verification) {
    return (
      <VerifyEmail
        email={verification.email}
        message={verification.message}
        emailSent={verification.emailSent}
        resendAvailableIn={verification.resendAvailableIn}
        expiresIn={verification.expiresIn}
        onVerified={handleVerified}
        onBack={() => setVerification(null)}
      />
    );
  }


  return (

    <div className="min-h-screen bg-[#315d42] flex items-center justify-center p-4">


      {/* MAIN LOGIN CONTAINER */}

      <div className="relative w-full max-w-[1200px] min-h-[670px] bg-white rounded-[28px] overflow-hidden shadow-2xl flex">


        {/* ================= LEFT SIDE ================= */}

        <div className="relative hidden md:flex w-1/2 overflow-hidden">


          {/* BACKGROUND IMAGE */}

          <img
            src={volunteer}
            alt="Volunteers helping the environment"
            className="absolute inset-0 w-full h-full object-cover"
          />


          {/* GREEN OVERLAY */}

          <div className="absolute inset-0 bg-[#008f35]/75"></div>


          {/* GRADIENT */}

          <div className="absolute inset-0 bg-gradient-to-b from-[#006b2d]/30 to-[#00a83b]/30"></div>


          {/* BACK BUTTON */}

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
              bg-[#087a35]
              hover:bg-[#06652c]
              flex
              items-center
              justify-center
              transition
              text-white
            "
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>


          {/* LEFT CONTENT */}

          <div className="relative z-10 flex items-center w-full px-16">


            <div className="max-w-[430px]">


              <h2 className="text-4xl font-semibold tracking-wide mb-3 text-white">

                WELCOME

              </h2>


              <div className="flex items-center gap-2 mb-6">


                <div className="w-24 h-[1px] bg-white"></div>


                <span className="text-2xl font-normal text-white">

                  To EcoTask

                </span>


              </div>


              <p className="text-base leading-7 font-medium text-white">

                Organizers post environmental activities, track
                attendance, and issue certificates to volunteers.
                EcoTask is a platform that connects volunteers
                with meaningful environmental activities and
                community projects. Join us and make a positive
                impact on the planet.

              </p>


            </div>


          </div>


        </div>


        {/* ================= RIGHT SIDE ================= */}

        <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-20 py-10">


          <div className="w-full max-w-[500px]">


            {/* MOBILE BACK BUTTON */}

            <button
              onClick={onBack}
              className="
                md:hidden
                mb-6
                w-10
                h-10
                rounded-full
                bg-[#159447]
                text-white
                flex
                items-center
                justify-center
              "
            >
              <ArrowLeft size={18} />
            </button>


            {/* ECOTASK LOGO */}

            <div className="flex justify-center mb-4">

              <EcoTaskLogo />

            </div>


            {/* TITLE */}

            <h1 className="text-center text-[42px] font-extrabold tracking-tight text-[#111827] mb-3">
              Organizer Login
            </h1>


            <p className="text-center text-sm text-[#6b7280] mb-7">

              Post activities, track attendance, and issue certificates.

            </p>


            {/* FORM */}

            <form onSubmit={handleSubmit} className="auth-stagger">


              {/* ERROR / LOCKED MESSAGE */}

              {isLocked ? (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                >
                  <Clock size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Too many login attempts</p>
                    <p className="mt-0.5 text-amber-800">
                      For your security, sign-in is paused.
                    </p>
                  </div>
                </div>
              ) : error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}


              {/* EMAIL LABEL */}

              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#374151] mb-2"
              >

                Email address

              </label>


              {/* EMAIL INPUT */}

              <div className="relative mb-4">


                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />


                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  disabled={isLocked}
                  className="
                    w-full
                    h-13
                    min-h-[52px]
                    pl-12
                    pr-4
                    border
                    border-gray-300
                    rounded-md
                    outline-none
                    shadow-sm
                    transition
                    text-[#374151]
                    focus:border-[#20b84b]
                    focus:ring-2
                    focus:ring-[#20b84b]/20
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:opacity-70
                  "
                />


              </div>


              {/* PASSWORD LABEL */}

              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#374151] mb-2"
              >

                Password

              </label>


              {/* PASSWORD INPUT */}

              <div className="relative mb-4">


                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />


                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  disabled={isLocked}
                  className="
                    w-full
                    min-h-[52px]
                    pl-12
                    pr-12
                    border
                    border-gray-300
                    rounded-md
                    outline-none
                    shadow-sm
                    transition
                    text-[#374151]
                    focus:border-[#20b84b]
                    focus:ring-2
                    focus:ring-[#20b84b]/20
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:opacity-70
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
                    text-[#9ca3af]
                  "
                  aria-label="Toggle password visibility"
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>


              </div>


              {/* FORGOT PASSWORD */}

              {onForgotPassword && (
                <div className="mb-5 flex justify-end">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm font-semibold text-[#159447] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}


              <div className="mb-6 flex items-center gap-2 rounded-md border border-[#cfe9d6] bg-[#f3fbf5] px-3 py-2 text-xs text-[#2f6b43]">
                <Building2 size={15} className="shrink-0" />
                New organizer accounts must be approved by the admin before you can post activities.
              </div>


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isLocked || submitting}
                className="
                  w-full
                  min-h-[52px]
                  bg-[#16b941]
                  hover:bg-[#12a83a]
                  text-white
                  font-semibold
                  rounded-md
                  transition
                  shadow-sm
                  disabled:cursor-not-allowed
                  disabled:bg-gray-400
                  disabled:hover:bg-gray-400
                "
              >

                {isLocked
                  ? `Try again in ${formatCountdown(remainingMs)}`
                  : submitting
                    ? "Signing in..."
                    : "Sign In"}

              </button>


            </form>


            {/* SIGN UP */}

            <p className="text-center text-sm text-[#6b7280] mt-5">


              Don't have an organizer account?{" "}


              <button
                type="button"
                onClick={onRegister}
                className="
                  font-semibold
                  text-[#159447]
                  hover:underline
                "
              >

                Apply as Organizer

              </button>


            </p>


          </div>


        </div>


      </div>


    </div>

  );
}


export default OrganizerLogin;