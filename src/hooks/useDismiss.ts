import { useEffect, useRef, type RefObject } from 'react'

/** Closes a popover/menu on an outside click or Escape while it is open. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) onClose() }
    // An inner Radix popover handles Escape first and marks it, so only the top layer closes.
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) onClose() }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, onClose])
}

/** useDismiss with its own ref, for when the open state lives elsewhere. Put the ref on the wrapper. */
export function useDismissRoot(open: boolean, onClose: () => void) {
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, open, onClose)
  return rootRef
}
