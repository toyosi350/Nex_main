/* ------------------------------------------------------------------------
 * Session bridge (merge glue)
 *
 * The app has two session views over ONE backend session:
 *   - the ERP half keeps the canonical token/user in Redux
 *     (persisted as localStorage "nexiv.auth.v1"), and
 *   - the storefront half (src/marketplace) reads a lightweight
 *     signed-in user from localStorage "nexivCurrentUser".
 *
 * Keeping the two in sync here means signing in or out from either UI
 * works across the whole app without changing either data layer.
 * ---------------------------------------------------------------------- */

const CURRENT_KEY = 'nexivCurrentUser'
const SESSIONS_KEY = 'nexivSessions'

function storefrontUser(user) {
  return {
    username: user.username || user.name || user.email,
    email: user.email,
    role: user.role,
  }
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

let started = false

export function startSessionBridge(store) {
  if (started) return
  started = true

  let lastToken

  const sync = () => {
    const { accessToken, user } = store.getState().auth
    if (accessToken === lastToken) return
    lastToken = accessToken

    try {
      if (accessToken && user) {
        const acct = storefrontUser(user)
        localStorage.setItem(CURRENT_KEY, JSON.stringify(acct))
        // Keep the storefront's "saved accounts" list in step too
        // (used by the account menu's switch-account section).
        const others = readJson(SESSIONS_KEY, []).filter(
          (s) => s.email !== acct.email,
        )
        localStorage.setItem(
          SESSIONS_KEY,
          JSON.stringify([
            { email: acct.email, username: acct.username, lastUsed: Date.now() },
            ...others,
          ]),
        )
      } else {
        localStorage.removeItem(CURRENT_KEY)
      }
    } catch {
      /* storage unavailable - the halves degrade independently */
    }

    window.dispatchEvent(new Event('nexiv-auth-change'))
  }

  store.subscribe(sync)
  sync()
}
