/**
 * Central API base query.
 * Talks to the real backend at VITE_API_URL (see .env.local) via fetch.
 * Authentication tokens and tenant context are attached centrally here.
 */
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout, setToken, setCurrentUser, setCurrentVendor } from '../store/authSlice.js'
import { pushToast } from '../store/uiSlice.js'

const API_URL = import.meta.env.VITE_API_URL || ''

function tokenFrom(state) {
  if (!state?.auth) return null
  return state.auth.accessToken && state.auth.accessToken !== 'null' ? state.auth.accessToken : null
}

function refreshTokenFrom(state) {
  if (!state?.auth) return null
  return state.auth.refreshToken && state.auth.refreshToken !== 'null' ? state.auth.refreshToken : null
}

const fetchBaseQueryImpl = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = tokenFrom(getState())
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  },
})

/*
 * The backend wraps every success body in { success: true, data }.
 * Unwrapping here — once, centrally — keeps every endpoint, slice and
 * onQueryStarted reading plain contract payloads below this layer.
 */
async function realBaseQuery(args, api, extraOptions) {
  const result = await fetchBaseQueryImpl(args, api, extraOptions)
  if (
    result.data &&
    typeof result.data === 'object' &&
    result.data.success === true &&
    'data' in result.data
  ) {
    result.data = result.data.data
  }
  return result
}

async function realQueryWithRefresh(args, api, extraOptions) {
  let result = await realBaseQuery(args, api, extraOptions)
  if (result.error && (result.error.status === 401 || result.error.status === 'PARSING_ERROR')) {
    const refresh = refreshTokenFrom(api.getState())
    if (refresh) {
      const refreshResult = await realBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken: refresh } },
        api,
        extraOptions
      )
      if (refreshResult.data) {
        api.dispatch(setToken(refreshResult.data.accessToken))
        if (refreshResult.data.user) api.dispatch(setCurrentUser(refreshResult.data.user))
        if (refreshResult.data.vendor) api.dispatch(setCurrentVendor(refreshResult.data.vendor))
        result = await realBaseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logout())
      }
    } else {
      api.dispatch(logout())
    }
  }
  return result
}

export async function baseQuery(args, api, extraOptions) {
  return realQueryWithRefresh(args, api, extraOptions)
}

export function conditionalToast(api, message, type = 'success') {
  api.dispatch(
    pushToast({
      type,
      title: type === 'success' ? 'Success' : 'Error',
      message,
    })
  )
}