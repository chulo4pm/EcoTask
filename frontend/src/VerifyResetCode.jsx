import { AlertCircle, ArrowLeft, MailCheck, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import volunteer from "./assets/voluteer.jpg";
import CodeCountdown from "./CodeCountdown";
import { CODE_TTL_SECONDS, useSecondsLeft } from "./codeTimer";
import { RESET_CODE_KEY, RESET_COOLDOWN_KEY, RESET_EMAIL_KEY, RESET_EXPIRES_KEY } from "./ForgotPassword";
import { API_BASE_URL } from "./config";


/* =========================================================
   VERIFY RESET CODE  ("Check Your Email")
   Step 2 of Forgot Password. Checks the 6-digit code with
   the server, then moves on to Reset Password, which only
   asks for the new password.

   Props:
     email      - optional; falls back to the one saved by ForgotPassword
     onBack()   - back to Forgot Password
     onVerified(code) - code confirmed, go to Reset Password
========================================================= */

const API_URL = `${API_BASE_URL}/api/auth`;
const CODE_LENGTH = 6;

const readSession = (key) => {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
};

const writeSession = (key, value) => {
  try {
    if (value) sessionStorage.setItem(key, String(value));
    else sessionStorage.removeItem(key);
  } catch { /* private mode */ }
};

const friendlyError = (err) =>
  err.message === "Failed to fetch"
    ? "Can't reach the server. Please check your connection and try again."
    : err.message;


function EcoTaskLogo() {
  return (
    <div className="flex items-center font-black tracking-tight">
      <span className="text-[24px] text-[#1f5133]">Ec</span>
      <div className="mx-[2px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-[#4ade80] bg-[#075f2b]">
        <svg width="18" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
          <path d="M6.5 10.5L12 5L17.5 10.5" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-[24px] text-[#1f5133]">Task</span>
    </div>
  );
}


function VerifyResetCode({ email: emailProp, onBack, onVerified }) {

  const email = (emailProp || readSession(RESET_EMAIL_KEY)).trim().toLowerCase();

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(() => Number(readSession(RESET_COOLDOWN_KEY)) || 0);
  const [expiresAt, setExpiresAt] = useState(() => Number(readSession(RESET_EXPIRES_KEY)) || 0);
  const [now, setNow] = useState(() => Date.now());
  const inputs = useRef([]);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const code = digits.join("");
  const expired = useSecondsLeft(expiresAt) <= 0;


  useEffect(() => {
    if (cooldownLeft <= 0) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);


  const submitCode = async (fullCode) => {
    if (submitting || expired || fullCode.length !== CODE_LENGTH) return;

    setSubmitting(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch(`${API_URL}/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
      }
      const data = await res.json();

      if (!res.ok) {
        setDigits(Array(CODE_LENGTH).fill(""));
        inputs.current[0]?.focus();
        throw new Error(data.message || "Invalid code.");
      }

      writeSession(RESET_CODE_KEY, fullCode);
      onVerified?.(fullCode);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };


  const handleDigit = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, "");
    setError("");

    // Paste or phone autofill of the whole code.
    if (value.length >= CODE_LENGTH || (value.length > 2 && index === 0)) {
      const next = value.slice(0, CODE_LENGTH).split("");
      const filled = Array(CODE_LENGTH).fill("").map((_, i) => next[i] || "");
      setDigits(filled);
      inputs.current[Math.min(next.length, CODE_LENGTH - 1)]?.focus();
      if (next.length >= CODE_LENGTH) submitCode(filled.join(""));
      return;
    }

    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (next.every(Boolean)) submitCode(next.join(""));
  };


  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };


  const handleResend = async () => {
    if (cooldownLeft > 0 || resending || !email) return;

    setResending(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      const wait = Number(data.resendAvailableIn ?? data.retryAfter) || 60;
      const until = Date.now() + wait * 1000;
      setNow(Date.now());
      setCooldownUntil(until);
      writeSession(RESET_COOLDOWN_KEY, until);

      if (!res.ok) throw new Error(data.message || "Couldn't resend the code.");

      const newExpiry = Date.now() + (Number(data.expiresIn) || CODE_TTL_SECONDS) * 1000;
      setExpiresAt(newExpiry);
      writeSession(RESET_EXPIRES_KEY, newExpiry);

      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
      setInfo(`A new code was sent to ${email}.`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResending(false);
    }
  };


  return (

    <div className="min-h-screen bg-[#315d42] flex items-center justify-center p-4">

      <div className="relative w-full max-w-[1200px] min-h-[670px] bg-white rounded-[28px] overflow-hidden shadow-2xl flex">


        {/* ================= LEFT SIDE ================= */}

        <div className="relative hidden md:flex w-1/2 overflow-hidden">

          <img src={volunteer} alt="Volunteers helping the environment" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#008f35]/80"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#006b2d]/40 to-[#00a83b]/40"></div>

          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-20 w-11 h-11 rounded-full bg-[#087a35] hover:bg-[#06652c] text-white flex items-center justify-center transition"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative z-10 flex items-center w-full px-16">
            <div className="max-w-[430px] text-white">
              <h2 className="text-4xl font-semibold tracking-wide mb-3">VERIFY</h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-24 h-[1px] bg-white"></div>
                <span className="text-2xl font-normal">Your Account</span>
              </div>
              <p className="text-base leading-7 font-medium">
                We've sent a verification code to your email address.
                Enter the code to continue resetting your EcoTask password.
              </p>
            </div>
          </div>

        </div>


        {/* ================= RIGHT SIDE ================= */}

        <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-16 py-12">

          <div className="w-full max-w-[460px] text-center">

            <button
              onClick={onBack}
              className="md:hidden mb-6 w-10 h-10 rounded-full bg-[#159447] text-white flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex justify-center mb-6">
              <EcoTaskLogo />
            </div>

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ec]">
              <MailCheck size={30} className="text-[#159447]" />
            </div>

            <h1 className="text-4xl font-bold text-[#1f2937] mb-3">Check Your Email</h1>

            {!email ? (
              <>
                <p className="text-sm leading-6 text-[#6b7280]">
                  We don't know which account to reset yet. Go back and enter your email first.
                </p>
                <button
                  type="button"
                  onClick={onBack}
                  className="mt-8 w-full min-h-[54px] bg-[#16b941] hover:bg-[#12a83a] text-white font-semibold rounded-md transition shadow-sm"
                >
                  Enter My Email
                </button>
              </>
            ) : (
              <>
                <p className="text-sm leading-6 text-[#6b7280]">We sent a 6-digit verification code to</p>
                <p className="mb-4 font-semibold text-[#159447] break-all">{email}</p>

                <div className="mb-6 flex justify-center">
                  <CodeCountdown expiresAt={expiresAt} />
                </div>

                <form noValidate onSubmit={(e) => { e.preventDefault(); submitCode(code); }}>

                  {error ? (
                    <div role="alert" className="mb-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  ) : info && (
                    <div role="status" className="mb-5 rounded-md border border-[#cfe9d6] bg-[#f3fbf5] px-4 py-3 text-sm font-medium text-[#2f6b43]">
                      {info}
                    </div>
                  )}

                  <div className="flex justify-center gap-2 sm:gap-3" aria-label="Verification code">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputs.current[index] = el; }}
                        value={digit}
                        onChange={(e) => handleDigit(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                          if (pasted) handleDigit(0, pasted.slice(0, CODE_LENGTH));
                        }}
                        onFocus={(e) => e.target.select()}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={CODE_LENGTH}
                        disabled={submitting}
                        aria-label={`Digit ${index + 1}`}
                        className={`h-[60px] w-[50px] sm:w-[56px] rounded-md border bg-white text-center text-2xl font-semibold text-[#1f2937] shadow-sm outline-none transition focus:ring-2 disabled:bg-gray-50 ${
                          error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                            : "border-gray-300 focus:border-[#20b84b] focus:ring-[#20b84b]/20"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={code.length !== CODE_LENGTH || submitting || expired}
                    className="mt-8 w-full min-h-[54px] bg-[#16b941] hover:bg-[#12a83a] text-white font-semibold rounded-md transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Checking..." : "Verify Code"}
                  </button>
                </form>

                <p className="mt-6 text-sm text-[#6b7280]">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldownLeft > 0 || resending}
                    className="inline-flex items-center gap-1 font-semibold text-[#159447] hover:underline disabled:cursor-not-allowed disabled:text-[#9ca3af] disabled:no-underline"
                  >
                    <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
                    {cooldownLeft > 0 ? `Resend in ${cooldownLeft}s` : resending ? "Sending..." : "Resend Code"}
                  </button>
                </p>
              </>
            )}

            <button
              type="button"
              onClick={onBack}
              className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#159447] transition"
            >
              <ArrowLeft size={16} />
              Back to Forgot Password
            </button>

          </div>

        </div>

      </div>

    </div>

  );

}


export default VerifyResetCode;
