import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { pushToast, dismissToast } from '../store/uiSlice.js'

export function useToast() {
  const dispatch = useDispatch()
  const toasts = useSelector((state) => state.ui.toasts)

  const notify = useCallback(
    (title, message = '', type = 'info', duration) => {
      dispatch(pushToast({ title, message, type, duration }))
    },
    [dispatch]
  )

  const success = useCallback((message, title = 'Success') => notify(title, message, 'success'), [notify])
  const error = useCallback((message, title = 'Error') => notify(title, message, 'error'), [notify])
  const warning = useCallback((message, title = 'Warning') => notify(title, message, 'warning'), [notify])
  const info = useCallback((message, title = 'Notice') => notify(title, message, 'info'), [notify])

  const dismiss = useCallback((id) => dispatch(dismissToast(id)), [dispatch])

  return { toasts, notify, success, error, warning, info, dismiss }
}