import { CalendarClock, CalendarX2, Ban } from "lucide-react"
import { useCountdown } from "../../hooks/useCountdown"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-8">
      <span className="font-mono font-extrabold text-sm leading-none tabular-nums">{pad(value)}</span>
      <span className="text-[9px] opacity-70 mt-0.5">{label}</span>
    </div>
  )
}

/** Compact, live-ticking due-date badge. Shows "no deadline" clearly when none is set. */
function DueCountdown({ dueDate, size = "sm" }: { dueDate?: string | null; size?: "sm" | "md" }) {
  const countdown = useCountdown(dueDate)
  const padding = size === "md" ? "px-4 py-2.5" : "px-3 py-1.5"

  if (!countdown.hasDeadline) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${padding} rounded-xl border border-border bg-background text-muted text-xs font-bold`}>
        <CalendarX2 className="w-3.5 h-3.5" />
        بدون موعد تسليم محدد
      </span>
    )
  }

  if (countdown.expired) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${padding} rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold`}>
        <Ban className="w-3.5 h-3.5" />
        انتهى وقت التسليم
      </span>
    )
  }

  const urgent = countdown.days === 0 && countdown.hours < 1

  return (
    <span className={`inline-flex items-center gap-2.5 ${padding} rounded-xl border text-xs font-bold ${
      urgent ? "border-red-200 bg-red-50 text-red-600" : "border-indigo-200 bg-indigo-50 text-indigo-600"
    }`}>
      <CalendarClock className="w-3.5 h-3.5 shrink-0" />
      <span className="flex items-center gap-1.5">
        {countdown.days > 0 && (
          <>
            <TimeBlock value={countdown.days} label="يوم" />
            <span className="opacity-40">:</span>
          </>
        )}
        <TimeBlock value={countdown.hours} label="ساعة" />
        <span className="opacity-40">:</span>
        <TimeBlock value={countdown.minutes} label="دقيقة" />
        <span className="opacity-40">:</span>
        <TimeBlock value={countdown.seconds} label="ثانية" />
      </span>
    </span>
  )
}

export default DueCountdown
