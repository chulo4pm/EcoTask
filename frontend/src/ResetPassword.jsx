import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import { useState } from "react";
import volunteer from "./assets/voluteer.jpg";
import CodeCountdown from "./CodeCountdown";
import { RESET_CODE_KEY, RESET_COOLDOWN_KEY, RESET_EMAIL_KEY, RESET_EXPIRES_KEY } from "./ForgotPassword";
import { API_BASE_URL } from "./config";


/* =========================================================
   SETTINGS
   Password rules match Register.jsx and
   ecotask-backend/utils/validators.js
========================================================= */

const API_URL = `${API_BASE_URL}/api/auth`;

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
  { key: "special", label: "One special character", test: (v) => /[^A-Za-z\d]/.test(v) },
];

const readSession = (key) => {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
};

const writeSession = (key, value) => {
  try {
    if (value) sessionStorage.setItem(key, String(value));
    else sessionStorage.removeItem(key);
  } catch { /* private mode */ }
};


/* =========================================================
   ECOTASK LOGO
========================================================= */

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


/* =========================================================
   FIELD
========================================================= */

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12px] font-medium leading-4 text-red-600">
      <AlertCircle size={13} className="mt-[1px] shrink-0" />
      {children}
    </p>
  );
}

const inputClass = (hasError) => `
  w-full
  min-h-[52px]
  pl-12
  pr-12
  border
  rounded-md
  outline-none
  shadow-sm
  text-[#374151]
  transition
  focus:ring-2
  disabled:bg-gray-50
  ${hasError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
    : "border-gray-300 focus:border-[#20b84b] focus:ring-[#20b84b]/20"}
`;


/* =========================================================
   RESET PASSWORD
========================================================= */

function ResetPassword({
  email: emailProp,
  code: codeProp,
  onBack,
  onResetSuccess,
}) {

  const email = (emailProp || readSession(RESET_EMAIL_KEY)).trim().toLowerCase();
  // Confirmed on the "Check Your Email" page (VerifyResetCode.jsx).
  const code = (codeProp || readSession(RESET_CODE_KEY)).replace(/\D/g, "");
  const ready = Boolean(email && code.length === 6);

  const [expiresAt] = useState(() => Number(readSession(RESET_EXPIRES_KEY)) || 0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  // True when the code expired while the user was typing: they need a new one.
  const [codeExpired, setCodeExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rulesMet = PASSWORD_RULES.filter((rule) => rule.test(password)).length;


  const clearFieldError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  };


  const validate = () => {
    const errors = {};
    if (!password) errors.password = "New password is required.";
    else if (password.length > 64) errors.password = "Password must be 64 characters or fewer.";
    else {
      const failed = PASSWORD_RULES.find((rule) => !rule.test(password));
      if (failed) errors.password = `Password needs: ${failed.label.toLowerCase()}.`;
    }
    if (!confirmPassword) errors.confirmPassword = "Please confirm your new password.";
    else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
    return errors;
  };


  const handleSubmit = async (e) => {

    e.preventDefault();
    if (submitting) return;

    const errors = validate();
    setFieldErrors(errors);
    setError("");
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password, confirmPassword }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
      }
      const data = await res.json();

      if (!res.ok) {
        if (data.errors?.code) {
          // Code expired or used up: the user must go back and get a new one.
          writeSession(RESET_CODE_KEY, "");
          setCodeExpired(true);
        } else if (data.errors && typeof data.errors === "object") {
          setFieldErrors(data.errors);
        }
        throw new Error(data.message || "Couldn't reset your password.");
      }

      writeSession(RESET_EMAIL_KEY, "");
      writeSession(RESET_CODE_KEY, "");
      writeSession(RESET_COOLDOWN_KEY, "");
      writeSession(RESET_EXPIRES_KEY, "");
      onResetSuccess?.();
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

          <img
            src={volunteer}
            alt="Volunteers helping the environment"
            className="absolute inset-0 w-full h-full object-cover"
          />

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

              <h2 className="text-4xl font-semibold tracking-wide mb-3">
                CREATE
              </h2>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-24 h-[1px] bg-white"></div>
                <span className="text-2xl font-normal">New Password</span>
              </div>

              <p className="text-base leading-7 font-medium">
                Your code is confirmed. Choose a strong new
                password. For your safety, you'll be signed out
                on every device that used your old password.
              </p>

            </div>
          </div>

        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-16 py-10">

          <div className="w-full max-w-[460px]">


            {/* MOBILE BACK */}

            <button
              onClick={onBack}
              className="md:hidden mb-6 w-10 h-10 rounded-full bg-[#159447] text-white flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>


            {/* LOGO */}

            <div className="flex justify-center mb-5">
              <EcoTaskLogo />
            </div>


            {/* SHIELD ICON */}

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ec]">
              <ShieldCheck size={31} className="text-[#159447]" />
            </div>


            {/* TITLE */}

            <h1 className="text-center text-4xl font-bold text-[#1f2937] mb-2">
              Reset Password
            </h1>


            {/* NO CONFIRMED CODE (page opened directly, or the code expired) */}

            {!ready || codeExpired ? (
              <div className="mt-6 text-center">
                <p className="text-sm leading-6 text-[#6b7280]">
                  {codeExpired
                    ? "Your code expired before the password was saved. Go back and get a new code."
                    : "Please confirm the code from your email first."}
                </p>
                <button
                  type="button"
                  onClick={onBack}
                  className="mt-6 w-full min-h-[52px] bg-[#16b941] hover:bg-[#12a83a] text-white font-semibold rounded-md transition shadow-sm"
                >
                  {codeExpired ? "Get a New Code" : "Go Back"}
                </button>
              </div>
            ) : (
              <>

                <p className="text-center text-sm leading-6 text-[#6b7280] mb-6">
                  Resetting the password for{" "}
                  <span className="font-semibold text-[#1f2937] break-all">{email}</span>
                </p>

                <div className="mb-6 flex justify-center">
                  <CodeCountdown expiresAt={expiresAt} />
                </div>

                <form onSubmit={handleSubmit} noValidate className="auth-stagger">


                  {/* ERROR */}

                  {error && (
                    <div role="alert" className="mb-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}


                  {/* NEW PASSWORD */}

                  <label htmlFor="new-password" className="block text-sm font-semibold text-[#374151] mb-2">
                    New Password
                  </label>

                  <div className="relative mb-3">
                    <Lock size={18} className="absolute left-4 top-[26px] -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      maxLength={64}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.password)}
                      className={inputClass(fieldErrors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-4 top-[26px] -translate-y-1/2 text-[#9ca3af] hover:text-[#159447] transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <FieldError>{fieldErrors.password}</FieldError>
                  </div>


                  {/* PASSWORD CHECKLIST */}

                  <div className="mb-4 rounded-md bg-[#f6faf7] px-3 py-2.5">
                    <div className="flex gap-1">
                      {PASSWORD_RULES.map((rule, index) => (
                        <div
                          key={rule.key}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            password && index < rulesMet ? "bg-[#16b83b]" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
                      {PASSWORD_RULES.map((rule) => {
                        const met = rule.test(password);
                        return (
                          <li
                            key={rule.key}
                            className={`flex items-center gap-1.5 text-[11px] transition-colors ${met ? "text-[#159447]" : "text-[#6b7280]"}`}
                          >
                            {met ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>


                  {/* CONFIRM PASSWORD */}

                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#374151] mb-2">
                    Confirm Password
                  </label>

                  <div className="relative mb-6">
                    <Lock size={18} className="absolute left-4 top-[26px] -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      maxLength={64}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      className={inputClass(fieldErrors.confirmPassword)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-4 top-[26px] -translate-y-1/2 text-[#9ca3af] hover:text-[#159447] transition"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <FieldError>{fieldErrors.confirmPassword}</FieldError>
                  </div>


                  {/* RESET BUTTON */}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[52px] bg-[#16b941] hover:bg-[#12a83a] text-white font-semibold rounded-md transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Resetting..." : "Reset Password"}
                  </button>

                </form>

              </>
            )}


            {/* BACK */}

            <button
              type="button"
              onClick={onBack}
              className="mx-auto mt-6 flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#159447] transition"
            >
              <ArrowLeft size={16} />
              Back to Verification
            </button>


          </div>

        </div>


      </div>


    </div>

  );

}


export default ResetPassword;
