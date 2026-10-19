import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Mail,
} from "lucide-react";

import { useState } from "react";
import volunteer from "./assets/voluteer.jpg";
import { API_BASE_URL } from "./config";


const API_URL = `${API_BASE_URL}/api/auth`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The Reset Password page reads these, so the user doesn't have to type the email twice.
export const RESET_EMAIL_KEY = "ecotaskResetEmail";
export const RESET_COOLDOWN_KEY = "ecotaskResetCooldownUntil";
export const RESET_EXPIRES_KEY = "ecotaskResetCodeExpiresAt";
export const RESET_CODE_KEY = "ecotaskResetCode"; // set once the code is confirmed

const remember = (key, value) => {
  try { sessionStorage.setItem(key, String(value)); } catch { /* private mode */ }
};


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
   FORGOT PASSWORD
========================================================= */

function ForgotPassword({
  onBack,
  onSendCode,
}) {

  const [email, setEmail] = useState(() => {
    try { return sessionStorage.getItem(RESET_EMAIL_KEY) || ""; } catch { return ""; }
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e) => {

    e.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. juan@example.com).");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
      }
      const data = await res.json();

      // 429 from the cooldown still means a code was sent recently: go enter it.
      const cooldownOnly = res.status === 429 && data.resendAvailableIn;
      if (!res.ok && !cooldownOnly) {
        throw new Error(data.errors?.email || data.message || "Couldn't send the code.");
      }

      const wait = Number(data.resendAvailableIn) || 60;
      remember(RESET_EMAIL_KEY, cleanEmail);
      remember(RESET_COOLDOWN_KEY, Date.now() + wait * 1000);
      remember(RESET_EXPIRES_KEY, Date.now() + (Number(data.expiresIn) || 10 * 60) * 1000);

      onSendCode?.(cleanEmail);
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

    <div className="min-h-screen bg-[#315d42] flex items-center justify-center p-4">


      {/* =================================================
          MAIN CONTAINER
      ================================================= */}

      <div className="relative w-full max-w-[1200px] min-h-[670px] bg-white rounded-[28px] overflow-hidden shadow-2xl flex">


        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="relative hidden md:flex w-1/2 overflow-hidden">


          {/* BACKGROUND IMAGE */}

          <img
            src={volunteer}
            alt="Volunteers helping the environment"
            className="
              absolute
              inset-0
              w-full
              h-full
              object-cover
            "
          />


          {/* GREEN OVERLAY */}

          <div className="absolute inset-0 bg-[#008f35]/80"></div>


          {/* GRADIENT */}

          <div className="absolute inset-0 bg-gradient-to-b from-[#006b2d]/40 to-[#00a83b]/40"></div>


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
              text-white
              flex
              items-center
              justify-center
              transition
            "
            aria-label="Back"
          >

            <ArrowLeft size={20} />

          </button>


          {/* LEFT CONTENT */}

          <div className="relative z-10 flex items-center w-full px-16">


            <div className="max-w-[430px] text-white">


              <h2 className="text-4xl font-semibold tracking-wide mb-3">

                RESET

              </h2>


              <div className="flex items-center gap-2 mb-6">


                <div className="w-24 h-[1px] bg-white"></div>


                <span className="text-2xl font-normal">

                  Your Password

                </span>


              </div>


              <p className="text-base leading-7 font-medium">

                Don't worry! Enter your email address and
                we'll send you a verification code to help
                you reset your EcoTask password.

              </p>


            </div>


          </div>


        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-20 py-12">


          <div className="w-full max-w-[500px]">


            {/* MOBILE BACK */}

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


            {/* LOGO */}

            <div className="flex justify-center mb-6">

              <EcoTaskLogo />

            </div>


            {/* EMAIL ICON */}

            <div
              className="
                mx-auto
                mb-6
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-[#e8f7ec]
              "
            >

              <Mail
                size={30}
                className="text-[#159447]"
              />

            </div>


            {/* TITLE */}

            <h1 className="text-center text-4xl font-bold text-[#1f2937] mb-3">

              Forgot Password?

            </h1>


            {/* DESCRIPTION */}

            <p className="text-center text-sm leading-6 text-[#6b7280] mb-8">

              No worries! Enter your email address and we'll
              send you a verification code to reset your password.

            </p>


            {/* FORM */}

            <form onSubmit={handleSubmit} noValidate className="auth-stagger">


              {/* ERROR MESSAGE */}

              {error && (
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
                htmlFor="forgot-email"
                className="
                  block
                  text-sm
                  font-semibold
                  text-[#374151]
                  mb-2
                "
              >

                Email address

              </label>


              {/* EMAIL INPUT */}

              <div className="relative mb-4">


                <Mail
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-[#9ca3af]
                  "
                />


                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  maxLength={100}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(error)}
                  className="
                    w-full
                    min-h-[54px]
                    pl-12
                    pr-4
                    border
                    border-gray-300
                    rounded-md
                    outline-none
                    shadow-sm
                    text-[#374151]
                    transition
                    focus:border-[#20b84b]
                    focus:ring-2
                    focus:ring-[#20b84b]/20
                    disabled:bg-gray-50
                  "
                />


              </div>


              {/* HOW IT WORKS */}

              <div className="mb-6 flex items-start gap-2 rounded-md border border-[#cfe9d6] bg-[#f3fbf5] px-3 py-2.5 text-xs leading-5 text-[#2f6b43]">
                <Clock size={15} className="mt-[2px] shrink-0" />
                We'll email you a 6-digit code. It works for 10 minutes. Check your spam folder if you don't see it.
              </div>


              {/* SEND CODE BUTTON */}

              <button
                type="submit"
                disabled={submitting}
                className="
                  w-full
                  min-h-[54px]
                  bg-[#16b941]
                  hover:bg-[#12a83a]
                  text-white
                  font-semibold
                  rounded-md
                  transition
                  shadow-sm
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {submitting ? "Sending Code..." : "Send Verification Code"}

              </button>


            </form>


            {/* BACK TO LOGIN */}

            <p className="text-center text-sm text-[#6b7280] mt-6">


              Remember your password?{" "}


              <button
                type="button"
                onClick={onBack}
                className="
                  font-semibold
                  text-[#159447]
                  hover:underline
                "
              >

                Back to Login

              </button>


            </p>


          </div>


        </div>


      </div>


    </div>

  );

}


export default ForgotPassword;