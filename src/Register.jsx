import { SUPPORT_EMAIL } from "./contact";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";

import { useState } from "react";
import volunteer from "./assets/voluteer.jpg";
import VerifyEmail from "./VerifyEmail";
import { API_BASE_URL } from "./config";


/* =========================================================
   VALIDATION RULES
   Keep in sync with ecotask-backend/utils/validators.js
========================================================= */

const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PH_MOBILE_PATTERN = /^09\d{9}$/;

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
  { key: "special", label: "One special character", test: (v) => /[^A-Za-z\d]/.test(v) },
];

const STRENGTH_LEVELS = [
  { label: "", color: "bg-gray-200", text: "text-gray-400" },
  { label: "Very weak", color: "bg-red-500", text: "text-red-600" },
  { label: "Weak", color: "bg-orange-500", text: "text-orange-600" },
  { label: "Fair", color: "bg-yellow-500", text: "text-yellow-600" },
  { label: "Good", color: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", color: "bg-[#16b83b]", text: "text-[#159447]" },
];

const validators = {
  fullName: (value) => {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) return "Full name is required.";
    if (name.length < 2 || name.length > 50) return "Full name must be 2 to 50 characters.";
    if (!NAME_PATTERN.test(name)) return "Only letters, spaces, periods, hyphens, and apostrophes are allowed.";
    if ((name.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length < 2) return "Full name must contain at least 2 letters.";
    return "";
  },
  email: (value) => {
    const email = value.trim();
    if (!email) return "Email address is required.";
    if (email.length > 100) return "Email address is too long.";
    if (!EMAIL_PATTERN.test(email)) return "Please enter a valid email address (e.g. juan@example.com).";
    return "";
  },
  phone: (value) => {
    if (!value) return "Phone number is required.";
    if (!value.startsWith("09")) return "Phone number must start with 09.";
    if (!PH_MOBILE_PATTERN.test(value)) return `Phone number must be 11 digits (${value.length}/11).`;
    return "";
  },
  password: (value) => {
    if (!value) return "Password is required.";
    if (value.length > 64) return "Password must be 64 characters or fewer.";
    const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
    return failed ? `Password needs: ${failed.label.toLowerCase()}.` : "";
  },
  confirmPassword: (value, values) => {
    if (!value) return "Please confirm your password.";
    if (value !== values.password) return "Passwords do not match.";
    return "";
  },
};

const validateAll = (values) =>
  Object.fromEntries(
    Object.keys(validators).map((field) => [field, validators[field](values[field], values)])
  );

// Backend uses `name`; the form field is `fullName`.
const SERVER_FIELD_MAP = { name: "fullName" };

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
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
   GOOGLE ICON
========================================================= */

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.51h3.14c1.84-1.69 2.91-4.18 2.91-7.28Z"
      />

      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.83-.87 6.44-2.35l-3.14-2.51c-.87.58-1.99.92-3.3.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.59A9.75 9.75 0 0 0 12 21.75Z"
      />

      <path
        fill="#FBBC05"
        d="M6.53 13.78A5.87 5.87 0 0 1 6.22 12c0-.62.11-1.22.31-1.78V7.63H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.37l3.25-2.59Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.28 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.38l3.25 2.59c.77-2.31 2.93-4.03 5.47-4.03Z"
      />
    </svg>
  );
}


/* =========================================================
   FORM FIELD
   Input box with icon, red border when invalid, and an
   error message underneath.
========================================================= */

function FormField({
  icon: Icon,
  error,
  valid,
  children,
  trailing,
  className = "mb-3",
  id,
}) {
  const borderClass = error
    ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/15"
    : valid
      ? "border-[#20b83f] focus-within:border-[#20b83f] focus-within:ring-[#20b83f]/10"
      : "border-[#cbd5d0] focus-within:border-[#20b83f] focus-within:ring-[#20b83f]/10";

  return (
    <div className={className}>
      <div
        className={`
          flex
          h-[50px]
          items-center
          gap-3
          rounded-md
          border
          bg-white
          px-4
          shadow-sm
          transition
          focus-within:ring-2
          ${borderClass}
        `}
      >
        <Icon
          size={17}
          className={`shrink-0 ${error ? "text-red-500" : "text-[#64748b]"}`}
        />

        {children}

        {trailing}
      </div>

      {error && (
        <p
          id={id}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[12px] font-medium leading-4 text-red-600"
        >
          <AlertCircle size={13} className="mt-[1px] shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}


/* =========================================================
   PASSWORD STRENGTH METER
========================================================= */

function PasswordStrength({ password }) {
  const metCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const level = password ? STRENGTH_LEVELS[metCount] : STRENGTH_LEVELS[0];

  return (
    <div className="mb-3 -mt-1 rounded-md bg-[#f6faf7] px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {PASSWORD_RULES.map((rule, index) => (
            <div
              key={rule.key}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                password && index < metCount ? level.color : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span className={`w-[64px] text-right text-[11px] font-semibold ${level.text}`}>
          {level.label}
        </span>
      </div>

      <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.key}
              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                met ? "text-[#159447]" : "text-[#6b7280]"
              }`}
            >
              {met ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}


/* =========================================================
   REGISTER
========================================================= */

const inputClass = `
  h-full
  w-full
  border-none
  bg-transparent
  text-[14px]
  text-[#374151]
  outline-none
  placeholder:text-[#6b7280]
`;

function Register({
  onBack,
  onLogin,
  onRegister,
  onGoogleRegister,
}) {

  const [values, setValues] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [policyModal, setPolicyModal] = useState(null);
  // Set after sign-up: shows the "enter your code" screen.
  const [verification, setVerification] = useState(null);
  // Props for the code screen, or null while the user is on the form. Going back
  // from the code screen keeps `verification` so they can return without a new code.
  const [codeScreen, setCodeScreen] = useState(null);

  const openCodeScreen = (data, receivedAt) => {
    const elapsed = Math.floor((Date.now() - receivedAt) / 1000);
    setCodeScreen({
      resendAvailableIn: Math.max(0, (Number(data.resendAvailableIn) || 0) - elapsed),
      expiresIn: Math.max(0, (Number(data.expiresIn) || 10 * 60) - elapsed),
    });
  };

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordFocused, setPasswordFocused] =
    useState(false);

  const errors = validateAll(values);

  // Show an error only after the user has left the field (or tried to submit).
  const visibleError = (field) =>
    serverErrors[field] || (touched[field] ? errors[field] : "");

  const isValid = (field) =>
    touched[field] && !errors[field] && !serverErrors[field];


  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // Phone: digits only, max 11.
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 11);
    }

    // Name: block digits and symbols as they're typed.
    if (name === "fullName") {
      value = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ.' -]/g, "").slice(0, 50);
    }

    setValues((prev) => ({ ...prev, [name]: value }));

    if (serverErrors[name]) {
      setServerErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setFormError("");
  };


  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "password") setPasswordFocused(false);
  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!acceptedTerms) return;

    // Reveal every error on submit.
    setTouched(Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, true])));

    const firstInvalid = Object.keys(errors).find((field) => errors[field]);
    if (firstInvalid) {
      e.currentTarget.elements[firstInvalid]?.focus();
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.fullName.trim().replace(/\s+/g, " "),
          email: values.email.trim().toLowerCase(),
          phone: values.phone,
          password: values.password,
        }),
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
      }

      if (!res.ok) {
        // Put per-field server errors under the matching input.
        if (data.errors && typeof data.errors === "object") {
          const mapped = Object.fromEntries(
            Object.entries(data.errors).map(([key, message]) => [SERVER_FIELD_MAP[key] || key, message])
          );
          setServerErrors(mapped);
          return;
        }

        // Duplicate email with no field info from the server.
        if (res.status === 409 || /email/i.test(data.message || "")) {
          setServerErrors({ email: data.message || "Email is already in use." });
          return;
        }

        throw new Error(data.message || 'Registration failed');
      }

      // Account created but not active yet: ask for the emailed code.
      const receivedAt = Date.now();
      setVerification({ ...data, receivedAt });
      openCodeScreen(data, receivedAt);
    } catch (err) {
      setFormError(
        err.message === "Failed to fetch"
          ? "Can't reach the server. Please check your connection and try again."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };


  // Code verified: the server logs the volunteer in (returns a token).
  const handleVerified = (data) => {
    if (data.token) {
      localStorage.setItem('userInfo', JSON.stringify(data));
      if (onRegister) onRegister();
      else if (onLogin) onLogin();
    } else if (onLogin) {
      onLogin();
    }
  };


  if (verification && codeScreen) {
    return (
      <VerifyEmail
        email={verification.email}
        message={verification.message}
        emailSent={verification.emailSent}
        resendAvailableIn={codeScreen.resendAvailableIn}
        expiresIn={codeScreen.expiresIn}
        onVerified={handleVerified}
        onBack={() => setCodeScreen(null)}
      />
    );
  }


  return (

    <div className="min-h-screen w-full bg-[#31583d] p-3 sm:p-4 lg:p-5 flex items-center justify-center">


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div
        className="
          relative
          flex
          min-h-[730px]
          w-full
          max-w-[1200px]
          overflow-hidden
          rounded-[26px]
          bg-white
          shadow-2xl
          lg:min-h-[760px]
        "
      >


        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={onBack}
          className="
            absolute
            left-5
            top-5
            z-30
            hidden
            lg:flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-black/30
            text-white
            backdrop-blur-sm
            transition
            hover:bg-black/40
            active:scale-95
          "
          aria-label="Back"
        >

          <ArrowLeft size={19} strokeWidth={2} />

        </button>


        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="relative hidden w-1/2 overflow-hidden lg:block">


          {/* IMAGE */}

          <img
            src={volunteer}
            alt="Volunteers helping the environment"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              object-center
            "
          />


          {/* GREEN OVERLAY */}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-br
              from-[#075f2b]/90
              via-[#07933d]/80
              to-[#19c94a]/65
            "
          />


          {/* LEFT CONTENT */}

          <div
            className="
              relative
              z-10
              flex
              h-full
              flex-col
              justify-center
              px-12
              xl:px-16
            "
          >


            <div className="max-w-[420px]">


              <h2 className="text-[30px] font-semibold tracking-tight text-white">

                WELCOME

              </h2>


              <div className="mt-2 flex items-center">


                <div className="h-px w-[100px] bg-white" />


                <span className="ml-3 text-[18px] font-light text-white">

                  To EcoTask

                </span>


              </div>


              <p className="mt-5 text-[14px] leading-7 text-white">

                EcoTask is a platform that connects volunteers
                with meaningful environmental activities and
                community projects. Join us and make a positive
                impact on the planet.

              </p>


            </div>


          </div>


        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div
          className="
            flex
            w-full
            flex-col
            justify-center
            bg-white
            px-7
            py-10
            sm:px-12
            lg:w-1/2
            lg:px-14
            xl:px-16
          "
        >


          {/* MOBILE BACK */}

          <button
            type="button"
            onClick={onBack}
            className="
              mb-6
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#159447]
              text-white
              lg:hidden
            "
          >

            <ArrowLeft size={18} />

          </button>


          {/* =================================================
              LOGO
          ================================================= */}

          <div className="mb-5 flex justify-center">

            <EcoTaskLogo />

          </div>


          {/* =================================================
              TITLE
          ================================================= */}

          <div className="text-center">


            <h1
              className="
                mx-auto
                max-w-[400px]
                text-[38px]
                font-bold
                leading-[1.05]
                tracking-tight
                text-[#1f2937]
                sm:text-[42px]
              "
            >

              Register to

              <br />

              Volunteer

            </h1>


            <p
              className="
                mx-auto
                mt-4
                max-w-[380px]
                text-[13px]
                leading-6
                text-[#4b5563]
              "
            >

              Fill up the form to get onboard as one of
              our volunteers at EcoTask.

            </p>


          </div>


          {/* =================================================
              FORM
          ================================================= */}

          {verification && !codeScreen && (
            <div
              role="status"
              className="mx-auto mt-6 flex w-full max-w-[460px] flex-wrap items-center justify-between gap-3 rounded-md border border-[#cfe9d6] bg-[#f3fbf5] px-4 py-3 text-left text-[13px] font-medium text-[#2f6b43]"
            >
              <span>
                We sent a code to <span className="break-all font-semibold">{verification.email}</span>.
              </span>
              <button
                type="button"
                onClick={() => openCodeScreen(verification, verification.receivedAt)}
                className="rounded-md bg-[#16b83b] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#12a834]"
              >
                Enter code
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="
              mx-auto
              mt-6
              w-full
              max-w-[430px]
            "
          >


            {/* SERVER / NETWORK ERROR */}

            {formError && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700"
              >
                <AlertCircle size={16} className="mt-[1px] shrink-0" />
                {formError}
              </div>
            )}


            {/* FULL NAME */}

            <FormField
              icon={User}
              id="fullName-error"
              error={visibleError("fullName")}
              valid={isValid("fullName")}
            >
              <input
                name="fullName"
                type="text"
                placeholder="Full name"
                autoComplete="name"
                value={values.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={50}
                aria-invalid={Boolean(visibleError("fullName"))}
                aria-describedby="fullName-error"
                className={inputClass}
              />
            </FormField>


            {/* EMAIL */}

            <FormField
              icon={Mail}
              id="email-error"
              error={visibleError("email")}
              valid={isValid("email")}
            >
              <input
                name="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={100}
                aria-invalid={Boolean(visibleError("email"))}
                aria-describedby="email-error"
                className={inputClass}
              />
            </FormField>


            {/* PHONE */}

            <FormField
              icon={Phone}
              id="phone-error"
              error={visibleError("phone")}
              valid={isValid("phone")}
            >
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                placeholder="Phone number (09XXXXXXXXX)"
                autoComplete="tel"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={11}
                aria-invalid={Boolean(visibleError("phone"))}
                aria-describedby="phone-error"
                className={inputClass}
              />
            </FormField>


            {/* PASSWORD */}

            <FormField
              icon={Lock}
              id="password-error"
              error={visibleError("password")}
              valid={isValid("password")}
              trailing={
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="
                    shrink-0
                    text-[#64748b]
                    transition
                    hover:text-[#159447]
                  "
                >

                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>
              }
            >
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={() => setPasswordFocused(true)}
                maxLength={64}
                aria-invalid={Boolean(visibleError("password"))}
                aria-describedby="password-error"
                className={inputClass}
              />
            </FormField>


            {/* PASSWORD STRENGTH — shows while typing or once there's a value */}

            {(passwordFocused || values.password) && (
              <PasswordStrength password={values.password} />
            )}


            {/* CONFIRM PASSWORD */}

            <FormField
              icon={Lock}
              id="confirmPassword-error"
              className="mb-5"
              error={visibleError("confirmPassword")}
              valid={isValid("confirmPassword")}
              trailing={
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="
                    shrink-0
                    text-[#64748b]
                    transition
                    hover:text-[#159447]
                  "
                >

                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>
              }
            >
              <input
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={64}
                aria-invalid={Boolean(visibleError("confirmPassword"))}
                aria-describedby="confirmPassword-error"
                className={inputClass}
              />
            </FormField>


            <div className="mb-4 flex items-start gap-2 text-sm text-[#374151]">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 accent-[#16b83b]"
              />

              <div>
                <label htmlFor="accept-terms">I agree to the </label>

                <button
                  type="button"
                  onClick={() => setPolicyModal("terms")}
                  className="font-medium text-[#159447] underline"
                >
                  Terms &amp; Conditions
                </button>

                {" and "}

                <button
                  type="button"
                  onClick={() => setPolicyModal("privacy")}
                  className="font-medium text-[#159447] underline"
                >
                  Privacy Policy
                </button>

                .
              </div>
            </div>


            {/* REGISTER BUTTON */}

            <button
              type="submit"
              disabled={submitting || !acceptedTerms}
              className="
                h-[52px]
                w-full
                rounded-md
                bg-[#16b83b]
                text-[14px]
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#12a834]
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {submitting ? "Creating Account..." : "Create Account"}

            </button>

            {policyModal && (
              <div
                className="ecotask-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                onClick={() => setPolicyModal(null)}
              >
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="policy-title"
                  className="ecotask-modal-panel max-h-[85vh] w-full max-w-[600px] overflow-y-auto rounded-xl bg-white p-6 text-[#374151] shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2
                        id="policy-title"
                        className="text-xl font-bold text-[#1f5133]"
                      >
                        {policyModal === "terms"
                          ? "Terms & Conditions"
                          : "Privacy Policy"}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPolicyModal(null)}
                      aria-label="Close policy"
                      className="rounded-md px-3 py-1 text-lg font-semibold text-[#6b7280] hover:bg-[#f3f7f4]"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4 text-sm leading-6">
                    {policyModal === "terms" ? (
                      <>
                        <p>
                          These Terms &amp; Conditions apply when you create an EcoTask
                          account or use the EcoTask platform. By creating an account, you
                          agree to follow these terms.
                        </p>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            1. Accounts
                          </h3>
                          <p>
                            Provide information that is accurate and keep your account
                            details up to date. You are responsible for activity carried
                            out through your account. Keep your password private and tell
                            us promptly if you believe someone else has accessed your
                            account.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            2. Participants
                          </h3>
                          <p>
                            Read each activity’s description, requirements, schedule, and
                            safety instructions before joining. Follow the organizer’s
                            reasonable instructions and behave respectfully toward other
                            participants. You are responsible for deciding whether an
                            activity is suitable for you and for following applicable
                            safety guidance.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            3. Organizers
                          </h3>
                          <p>
                            Organizer registration may require review and approval.
                            Provide accurate organization information and documents.
                            Organizers are responsible for the accuracy of their activity
                            listings, communicating important changes, and providing
                            appropriate instructions for their activities.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            4. Acceptable use
                          </h3>
                          <p>
                            Do not use EcoTask to break the law, impersonate another
                            person, harass others, submit misleading information, disrupt
                            the service, or access accounts or data without permission.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            5. Activities and availability
                          </h3>
                          <p>
                            Activity details, availability, and schedules may change.
                            EcoTask may update or remove listings and may temporarily
                            change or suspend parts of the platform for maintenance,
                            safety, or operational reasons.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            6. Account restrictions
                          </h3>
                          <p>
                            EcoTask may review reports of suspected misuse and may
                            restrict or suspend an account when reasonably necessary to
                            protect users or the platform. Where appropriate, we will
                            provide information about the restriction and how to contact
                            us.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            7. Changes and contact
                          </h3>
                          <p>
                            We may update these terms when the service or its requirements
                            change. We will post the updated version here. Questions can be sent to {SUPPORT_EMAIL}.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>
                          This Privacy Policy explains how EcoTask proposes to handle
                          personal information when you create an account or use the
                          platform. Update this draft to reflect the information you
                          actually collect and how you use it.
                        </p>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            1. Information you provide
                          </h3>
                          <p>
                            Depending on how you use EcoTask, this may include your name,
                            email address, phone number, password, organization details,
                            verification documents, activity registrations, and
                            information you send through forms or support requests.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            2. How information is used
                          </h3>
                          <p>
                            Information may be used to create and manage accounts, verify
                            organizer applications, operate activity registrations,
                            communicate service or account updates, respond to requests,
                            help protect the platform, and meet applicable legal
                            obligations.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            3. Sharing
                          </h3>
                          <p>
                            EcoTask should only share information when needed to operate
                            the service—for example, relevant registration details with
                            an activity organizer—or when required by law. Describe any
                            service providers that process information for EcoTask here,
                            and do not promise that information is never shared if that
                            is not accurate.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            4. Storage and security
                          </h3>
                          <p>
                            Information should be kept only as long as needed for the
                            purposes described in this policy or as required by law.
                            EcoTask should use appropriate safeguards to protect it, but
                            no method of online storage or transmission can be guaranteed
                            to be completely secure.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            5. Your choices and requests
                          </h3>
                          <p>
                            You may contact EcoTask to ask about the personal information
                            associated with your account, request a correction, or raise
                            a privacy concern. Requests may be subject to identity checks
                            and applicable legal requirements.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#1f5133]">
                            6. Policy updates and contact
                          </h3>
                          <p>
                            If this policy changes, the updated version will be posted here. For privacy questions or requests, contact {SUPPORT_EMAIL}.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPolicyModal(null)}
                    className="mt-6 w-full rounded-md bg-[#16b83b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#12a834]"
                  >
                    Close
                  </button>
                </section>
              </div>
            )}

          </form>


          {/* =================================================
              OR DIVIDER
          ================================================= */}




          {/* =================================================
              CONTINUE WITH GOOGLE
          ================================================= */}

          


          {/* =================================================
              LOGIN
          ================================================= */}

          <p className="mt-5 text-center text-[12px] text-[#6b7280]">


            Already have an account?{" "}


            <button
              type="button"
              onClick={onLogin}
              className="
                font-semibold
                text-[#159b35]
                hover:underline
              "
            >

              Sign In

            </button>


          </p>


        </div>


      </div>


    </div>

  );
}


export default Register;
