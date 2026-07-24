import { useEffect, useState } from "react"

export interface CountdownState {
  hasDeadline: boolean
  expired: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
}

function parseDueDate(dueDate?: string | null): number | null {
  if (!dueDate) return null
  const normalized = dueDate.includes("T") ? dueDate : dueDate.replace(" ", "T")
  const due = new Date(normalized)
  if (Number.isNaN(due.getTime())) return null
  // Dates saved without a time component default to end-of-day.
  if (!/\d{2}:\d{2}/.test(normalized)) due.setHours(23, 59, 59, 999)
  return due.getTime()
}

/** Live-ticking countdown to a due date. Returns hasDeadline=false when no valid date is set. */
export function useCountdown(dueDate?: string | null): CountdownState {
  const dueTs = parseDueDate(dueDate)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (dueTs === null) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [dueTs])

  if (dueTs === null) {
    return { hasDeadline: false, expired: false, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const diffMs = dueTs - now
  if (diffMs <= 0) {
    return { hasDeadline: true, expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
  const seconds = Math.floor((diffMs / 1000) % 60)

  return { hasDeadline: true, expired: false, days, hours, minutes, seconds }
}

export default useCountdown
