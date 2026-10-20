// "Trust this device for 7 days" (login code / MFA).
//
// After a correct login code the server hands this browser a secret token for ONE account.
// We keep one token per account email, so a single browser can trust any number of
// accounts (a volunteer, an organizer and an admin, for example). On the next login the
// token is sent along with the password; if the server still accepts it, no code is asked.
// Logging out does NOT remove it. Changing the password on the server cancels it.

const KEY = "ecotaskTrustedDevices";

const normalize = (email) => String(email || "").trim().toLowerCase();

const readAll = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
};

const writeAll = (all) => {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage blocked */ }
};

// Token to send with the login request ("" when this browser isn't trusted for that email).
export const getTrustToken = (email) => {
  const key = normalize(email);
  const all = readAll();
  const entry = all[key];
  if (!entry || !entry.token) return "";
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) {
    delete all[key];
    writeAll(all);
    return "";
  }
  return entry.token;
};

export const saveTrustToken = (email, token, expiresAt) => {
  if (!token) return;
  const all = readAll();
  const now = Date.now();
  // Tidy up: drop other accounts' tokens that already ran out.
  Object.keys(all).forEach((key) => {
    const at = all[key]?.expiresAt;
    if (at && new Date(at).getTime() <= now) delete all[key];
  });
  all[normalize(email)] = { token, expiresAt: expiresAt || null };
  writeAll(all);
};
