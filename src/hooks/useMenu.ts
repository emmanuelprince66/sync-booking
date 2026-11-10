import { useCallback, useRef, useState } from 'react'
import { useDismiss } from './useDismiss'

/** Open state for a dropdown: closes on an outside click or Escape. Put `rootRef` on the wrapper. */
export function useMenu() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen(value => !value), [])
  const show = useCallback(() => setOpen(true), [])
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, open, close)
  return { open, close, toggle, show, rootRef }
}
