import { createSlice } from '@reduxjs/toolkit'

let toastSeq = 0

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    toasts: [],
  },
  reducers: {
    pushToast(state, action) {
      const toast = {
        id: `toast-${++toastSeq}`,
        type: action.payload.type || 'info',
        title: action.payload.title || '',
        message: action.payload.message || '',
        duration: action.payload.duration ?? 4200,
      }
      state.toasts.push(toast)
      if (state.toasts.length > 5) state.toasts.shift()
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
  },
})

export const { pushToast, dismissToast } = notificationsSlice.actions
export default notificationsSlice.reducer