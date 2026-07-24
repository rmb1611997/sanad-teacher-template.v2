import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react"
import type { ReactNode } from "react"

interface ConfirmDeleteModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  isLoading?: boolean
  title?: string
  message: ReactNode
  confirmLabel?: string
  loadingLabel?: string
}

function ConfirmDeleteModal({
  open,
  onCancel,
  onConfirm,
  isLoading = false,
  title = "تأكيد الحذف",
  message,
  confirmLabel = "حذف نهائياً",
  loadingLabel = "جاري الحذف...",
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-md z-10 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-secondary mb-2">{title}</h2>
            <p className="text-muted text-sm leading-7 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                aria-label="إلغاء"
                className="flex-1 py-3 bg-background border border-border text-text font-bold rounded-xl hover:border-primary transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />إلغاء
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loadingLabel}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {confirmLabel}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmDeleteModal
