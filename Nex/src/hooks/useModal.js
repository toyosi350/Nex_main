import { useCallback, useState } from 'react'

export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [data, setData] = useState(null)

  const open = useCallback((payload = null) => {
    setData(payload)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  return { isOpen, open, close, data }
}