import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react"

export type ToastType = "success" | "error" | "warning"

export interface ToastData {
  id: string
  message: string
  type: ToastType
}

interface Props {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

function Toast({ toasts, onRemove }: Props) {
  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-3 w-full max-w-sm px-4"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const styles = {
    success: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-800",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    },
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      icon: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    },
  }

  const s = styles[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl ${s.bg}`}
    >
      {s.icon}
      <p className={`text-sm font-bold flex-1 text-right ${s.text}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="إغلاق"
        className={`flex-shrink-0 hover:opacity-70 transition ${s.text}`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export default Toast