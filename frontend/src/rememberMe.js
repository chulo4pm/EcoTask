// "Remember me" on the login page.
//
// Checked:   you stay logged in (until the token expires) and your email is filled in next time.
// Unchecked: you are logged out when the browser is closed, and the email is not saved.
//
// How it works: unchecked logins set a browser "session cookie", which the browser
// deletes when it closes. On the next visit, if the login was "don't remember" and
// that cookie is gone, the saved login is removed.

const EMAIL_KEY = "ecotaskRememberedEmail";
const SESSION_ONLY_KEY = "ecotaskSessionOnly";
const SESSION_COOKIE = "ecotaskSession";
const LOGIN_KEYS = ["userInfo", "organizerInfo", "adminInfo"];

const hasSessionCookie = () =>
  document.cookie.split(";").some((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));

export const getRememberedEmail = () => {
  try { return localStorage.getItem(EMAIL_KEY) || ""; } catch { return ""; }
};

// Call right before saving the login token.
export const applyRememberChoice = (email, remember) => {
  try {
    if (remember) {
      localStorage.setItem(EMAIL_KEY, email);
      localStorage.removeItem(SESSION_ONLY_KEY);
    } else {
      localStorage.removeItem(EMAIL_KEY);
      localStorage.setItem(SESSION_ONLY_KEY, "1");
      document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Lax`;
    }
  } catch { /* storage blocked */ }
};

// Call once when the app starts (main.jsx), before anything reads the saved login.
export const enforceSessionOnlyLogin = () => {
  try {
    if (localStorage.getItem(SESSION_ONLY_KEY) && !hasSessionCookie()) {
      LOGIN_KEYS.forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem(SESSION_ONLY_KEY);
    }
  } catch { /* storage blocked */ }
};
