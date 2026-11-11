import { useEffect, useState } from 'react'

/** Counts down once per second; `restart` starts it again (from `seconds`, or the given count). */
export function useResendTimer(seconds: number) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining(value => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  return {
    remaining,
    canResend: remaining <= 0,
    label: `${String(Math.floor(Math.max(remaining, 0) / 60)).padStart(2, '0')}:${String(Math.max(remaining, 0) % 60).padStart(2, '0')}`,
    restart: (from = seconds) => setRemaining(from),
  }
}
