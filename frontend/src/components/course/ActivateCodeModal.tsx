import { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, KeyRound, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { activateCode } from "../../services/api"
import { useAuth } from "../../context/useAuth"

interface Props {
  isOpen: boolean
  onClose: () => void
  courseTitle: string
  courseId: number
  onSuccess?: () => void
}

function ActivateCodeModal({ isOpen, onClose, courseTitle, onSuccess }: Props) {
  const { getToken } = useAuth()
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function handleClose() {
    setCode("")
    setStatus("idle")
    setErrorMsg("")
    onClose()
  }

  async function handleActivate() {
    if (code.length !== 8 || !/^\d+$/.test(code)) {
      setErrorMsg("الكود يجب أن يكون 8 أرقام")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMsg("")

    const token = getToken()
    if (!token) {
      setStatus("error")
      setErrorMsg("يجب تسجيل الدخول أولاً")
      return
    }

    const data = await activateCode(code, token)
    if (data.success) {
      setStatus("success")
      setTimeout(() => {
        handleClose()
        onSuccess?.()
      }, 1500)
    } else {
      setStatus("error")
      setErrorMsg(data.message || "الكود غير صحيح")
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-md z-10 shadow-2xl"
          >
            {/* Close */}
            <button
              onClick={handleClose}
              aria-label="إغلاق"
              className="absolute top-4 left-4 p-2 rounded-xl text-muted hover:text-secondary hover:bg-background transition"
            >
              <X className="w-5 h-5" />
            </button>

            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-secondary">تم التفعيل بنجاح! 🎉</h2>
                <p className="text-muted text-sm">تم تفعيل اشتراكك في كورس<br /><strong className="text-secondary">{courseTitle}</strong></p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-secondary">تفعيل الاشتراك</h2>
                  <p className="text-muted text-sm leading-6">
                    أدخل كود الاشتراك الخاص بك لتفعيل
                    <br />
                    <strong className="text-secondary">{courseTitle}</strong>
                  </p>
                </div>

                {/* Code Input */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="ادخل الكود (8 أرقام)"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                      setStatus("idle")
                      setErrorMsg("")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                    className={`w-full px-4 py-4 rounded-2xl border outline-none transition text-center font-mono text-2xl tracking-[0.4em] font-bold ${
                      status === "error"
                        ? "border-red-400 bg-red-50 text-red-600"
                        : "border-border bg-background text-secondary focus:border-primary"
                    }`}
                    maxLength={8}
                    dir="ltr"
                  />

                  {/* Error */}
                  <AnimatePresence>
                    {status === "error" && errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-red-500 text-sm justify-center"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errorMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Dots Preview */}
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i < code.length ? "bg-primary" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={handleActivate}
                  disabled={status === "loading" || code.length !== 8}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />جاري التحقق...</>
                  ) : (
                    <><KeyRound className="w-5 h-5" />تفعيل الاشتراك</>
                  )}
                </button>

                <p className="text-center text-xs text-muted">
                  الكود مكون من 8 أرقام وهو مخصص لهذا الكورس فقط
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default ActivateCodeModal