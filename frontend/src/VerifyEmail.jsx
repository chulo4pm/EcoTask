import { AlertCircle, ArrowLeft, CheckCircle2, MailCheck, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CodeCountdown from "./CodeCountdown";
import { CODE_TTL_SECONDS, useSecondsLeft } from "./codeTimer";
import { API_BASE_URL } from "./config";


/* =========================================================
   VERIFY EMAIL
   Shown after sign-up (volunteer or organizer) and when an
   unverified account tries to log in. The user types the
   6-digit code we emailed them.

   Props:
     email            - address the code was sent to
     message          - optional note from the server (e.g. "We sent a code…")
     emailSent        - false if the server couldn't send the first email
     resendAvailableIn- seconds before "Resend code" is allowed
     expiresIn        - seconds until the emailed code expires (default 10 min)
     onVerified(data) - called with the server response (includes token)
     onBack()         - go back to the previous screen
========================================================= */

const API_URL = `${API_BASE_URL}/api/auth`;
const CODE_LENGTH = 6;

const readJson = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text();
  throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
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


function VerifyEmail({
  email,
  message = "",
  emailSent = true,
  resendAvailableIn = 60,
  expiresIn = CODE_TTL_SECONDS,
  onVerified,
  onBack,
}) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState(
    emailSent ? "" : "We couldn't send the code. Tap \"Resend code\" to try again."
  );
  const [info, setInfo] = useState(emailSent ? message : "");
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(
    () => Date.now() + Math.max(0, Number(resendAvailableIn) || 0) * 1000
  );
  const [expiresAt, setExpiresAt] = useState(
    () => Date.now() + Math.max(0, Number(expiresIn) || CODE_TTL_SECONDS) * 1000
  );
  const [now, setNow] = useState(() => Date.now());
  const inputs = useRef([]);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const code = digits.join("");
  const expired = useSecondsLeft(expiresAt) <= 0;


  // Countdown for the resend button.
  useEffect(() => {
    if (cooldownLeft <= 0) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);


  const submitCode = async (fullCode) => {
    if (submitting || verified || expired || fullCode.length !== CODE_LENGTH) return;

    setSubmitting(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await readJson(res);

      if (!res.ok) {
        setDigits(Array(CODE_LENGTH).fill(""));
        inputs.current[0]?.focus();
        throw new Error(data.message || "Verification failed.");
      }

      setVerified(true);
      setInfo(data.alreadyVerified ? data.message : "Email verified! Taking you in…");
      window.setTimeout(() => onVerified?.(data), 900);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };


  const handleDigit = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, "");
    setError("");

    // Paste or phone autofill of the whole code into one box.
    if (value.length >= CODE_LENGTH || (value.length > 2 && index === 0)) {
      const next = value.slice(0, CODE_LENGTH).split("");
      const filled = Array(CODE_LENGTH).fill("").map((_, i) => next[i] || "");
      setDigits(filled);
      inputs.current[Math.min(next.length, CODE_LENGTH - 1)]?.focus();
      if (next.length >= CODE_LENGTH) submitCode(filled.join(""));
      return;
    }

    const next = [...digits];
    next[index] = value.slice(-1); // typing over a filled box keeps the newest digit
    setDigits(next);

    if (value && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (next.every(Boolean)) submitCode(next.join(""));
  };


  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };


  const handleResend = async () => {
    if (cooldownLeft > 0 || resending) return;

    setResending(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch(`${API_URL}/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readJson(res);

      const wait = Number(data.resendAvailableIn ?? data.retryAfter) || 60;
      setNow(Date.now());
      setCooldownUntil(Date.now() + wait * 1000);

      if (!res.ok) throw new Error(data.message || "Couldn't resend the code.");

      setExpiresAt(Date.now() + (Number(data.expiresIn) || CODE_TTL_SECONDS) * 1000);

      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
      setInfo(data.message || "A new code was sent.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResending(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-[#31583d] p-3 sm:p-4 lg:p-5 flex items-center justify-center">
      <div className="relative w-full max-w-[520px] rounded-[26px] bg-white px-7 py-10 shadow-2xl sm:px-12">

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#159447] text-white transition hover:bg-[#12803d] active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div className="mb-5 flex justify-center">
          <EcoTaskLogo />
        </div>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3fbf5] text-[#159447]">
          {verified ? <CheckCircle2 size={32} /> : <MailCheck size={32} />}
        </div>

        <h1 className="text-center text-[30px] font-bold tracking-tight text-[#1f2937]">
          Verify your email
        </h1>

        <p className="mx-auto mt-3 max-w-[380px] text-center text-[13px] leading-6 text-[#4b5563]">
          Enter the 6-digit code we sent to{" "}
          <span className="font-semibold text-[#1f2937] break-all">{email}</span>.
          Check your spam folder if you don't see it.
        </p>

        <div className="mt-4 flex justify-center">
          <CodeCountdown expiresAt={expiresAt} />
        </div>

        <form
          noValidate
          onSubmit={(e) => { e.preventDefault(); submitCode(code); }}
          className="mx-auto mt-6 w-full max-w-[380px]"
        >
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700">
              <AlertCircle size={16} className="mt-[1px] shrink-0" />
              {error}
            </div>
          )}

          {!error && info && (
            <div role="status" className="mb-4 flex items-start gap-2 rounded-md border border-[#cfe9d6] bg-[#f3fbf5] px-3 py-2.5 text-[13px] font-medium text-[#2f6b43]">
              <CheckCircle2 size={16} className="mt-[1px] shrink-0" />
              {info}
            </div>
          )}

          <div className="flex justify-between gap-2" aria-label="Verification code">
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
                disabled={submitting || verified}
                aria-label={`Digit ${index + 1}`}
                className={`h-[56px] w-full min-w-0 rounded-md border bg-white text-center text-[22px] font-bold text-[#1f2937] shadow-sm outline-none transition focus:ring-2 disabled:bg-gray-50 ${
                  error
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                    : "border-[#cbd5d0] focus:border-[#20b83f] focus:ring-[#20b83f]/10"
                }`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={code.length !== CODE_LENGTH || submitting || verified || expired}
            className="mt-6 h-[52px] w-full rounded-md bg-[#16b83b] text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#12a834] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verified ? "Verified" : submitting ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-[#6b7280]">
          Didn't get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldownLeft > 0 || resending || verified}
            className="inline-flex items-center gap-1 font-semibold text-[#159b35] hover:underline disabled:cursor-not-allowed disabled:text-[#9ca3af] disabled:no-underline"
          >
            <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
            {cooldownLeft > 0 ? `Resend code in ${cooldownLeft}s` : resending ? "Sending..." : "Resend code"}
          </button>
        </p>

      </div>
    </div>
  );
}


export default VerifyEmail;
