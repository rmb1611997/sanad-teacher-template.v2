import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { siteConfig } from "../../config/site"

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)

function cleanNumber(num: string): string {
  let cleaned = num.replace(/[^0-9]/g, "")
  if (cleaned.startsWith("00")) cleaned = cleaned.substring(2)
  if (cleaned.startsWith("01") && cleaned.length === 11) cleaned = "20" + cleaned.substring(1)
  else if (cleaned.startsWith("0")) cleaned = "20" + cleaned.substring(1)
  else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "20" + cleaned
  return cleaned
}

function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false)

  const numbers: string[] = siteConfig.contact?.whatsappNumbers || 
    (siteConfig.contact?.whatsapp ? [siteConfig.contact.whatsapp] : [])

  if (numbers.length === 0) return null

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-3">

      {/* Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-card border border-border rounded-2xl shadow-2xl p-4 w-64 origin-bottom-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-bold text-secondary flex items-center gap-2">
                <WhatsAppIcon className="w-5 h-5 text-green-500" />
                الدعم الفني
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق"
                className="text-muted hover:text-secondary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Numbers */}
            <div className="space-y-2">
              {numbers.map((num, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    window.open("https://wa.me/" + cleanNumber(num), "_blank")
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition group"
                  whileHover={{ x: -4 }}
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-secondary text-sm" dir="ltr">{num}</span>
                </motion.button>
              ))}
            </div>

            <p className="text-xs text-muted text-center mt-3">
              اضغط على الرقم للتواصل مباشرة
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <WhatsAppIcon className="w-7 h-7 relative z-10" />

        {/* Pulse */}
        <motion.div
          className="absolute inset-0 rounded-full bg-green-400"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

    </div>
  )
}

export default WhatsAppButton