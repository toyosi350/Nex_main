import { store } from "../../app/store";
import { logout as endWorkspaceSession } from "../../store/authSlice";

// Device-level session storage (frontend concern):
// which accounts are saved on this device, who is signed in, and the
// "signed in" badge state. Actual credentials are verified by nex_backend.
const SESSIONS_KEY = "nexivSessions";
const CURRENT_KEY = "nexivCurrentUser";
const LAST_KEY = "nexivLastEmail";

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function getCurrentUser() {
  return read(CURRENT_KEY, null);
}

export function getSessions() {
  return read(SESSIONS_KEY, []).sort(
    (a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)
  );
}

export function rememberSession(account) {
  if (!account?.email) return;

  const others = read(SESSIONS_KEY, []).filter(
    (s) => s.email !== account.email
  );
  localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify([
      ...others,
      {
        email: account.email,
        username: account.username || account.email,
        lastUsed: Date.now(),
      },
    ])
  );
}

export function removeSession(email) {
  localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify(read(SESSIONS_KEY, []).filter((s) => s.email !== email))
  );
  if (localStorage.getItem(LAST_KEY) === email) localStorage.removeItem(LAST_KEY);
}

export function switchToAccount(account) {
  if (!account?.email) return null;

  const user = {
    username: account.username || account.email,
    email: account.email,
  };
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
  localStorage.setItem(LAST_KEY, user.email);
  rememberSession(user);
  window.dispatchEvent(new Event("nexiv-auth-change"));
  return user;
}

export function signOutCurrent() {
  localStorage.removeItem(CURRENT_KEY);
  // The shared Redux session is the source of truth; ending it clears
  // the storefront view (this key) via the session bridge and refreshes
  // both halves of the app. Storefront sessions are stateless JWTs, so
  // there is nothing further to revoke server-side here.
  store.dispatch(endWorkspaceSession());
  window.dispatchEvent(new Event("nexiv-auth-change"));
}
