import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'nexiv.auth.v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.accessToken && parsed.user) return parsed
    }
  } catch {
    /* ignore corrupt storage */
  }
  return {
    user: null,
    vendor: null,
    accessToken: null,
    refreshToken: null,
    remember: false,
  }
}

const initialState = {
  ...loadInitial(),
  status: initialState_status(),
}

function initialState_status() {
  return loadInitial().accessToken ? 'authenticated' : 'anonymous'
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function persistSession(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: state.user,
        vendor: state.vendor,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        remember: !!state.remember,
      })
    )
  } catch {
    /* ignore quota errors */
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, vendor, accessToken, refreshToken, remember } = action.payload || {}
      if (accessToken) state.accessToken = accessToken
      if (refreshToken !== undefined) state.refreshToken = refreshToken
      if (user) state.user = user
      if (vendor) state.vendor = vendor
      if (remember !== undefined) state.remember = remember
      state.status = 'authenticated'
      persistSession(state)
    },
    setToken(state, action) {
      state.accessToken = action.payload
      state.status = 'authenticated'
      persistSession(state)
    },
    setCurrentUser(state, action) {
      state.user = action.payload
      persistSession(state)
    },
    setCurrentVendor(state, action) {
      state.vendor = action.payload
      persistSession(state)
    },
    logout(state) {
      state.user = null
      state.vendor = null
      state.accessToken = null
      state.refreshToken = null
      state.remember = false
      state.status = 'anonymous'
      clearStoredSession()
    },
  },
})

export const { setCredentials, setToken, setCurrentUser, setCurrentVendor, logout } = authSlice.actions
export default authSlice.reducer