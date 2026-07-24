import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Megaphone, Link as LinkIcon } from "lucide-react"
import { getAnnouncements } from "../../services/api"

interface Announcement {
  id: number
  title: string
  content: string
  linkUrl?: string
  createdAt: string
}

function AnnouncementsBell() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAnnouncements().then((data) => { if (Array.isArray(data)) setAnnouncements(data) })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-text hover:border-primary hover:text-primary transition"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {announcements.length > 0 && (
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {announcements.length > 9 ? "9+" : announcements.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 justify-end bg-background">
              <h3 className="font-bold text-secondary text-sm">الإشعارات</h3>
              <Megaphone className="w-4 h-4 text-primary" />
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {announcements.length === 0 ? (
                <div className="p-6 text-center">
                  <Megaphone className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-muted text-sm">لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="p-4 text-right hover:bg-primary/3 transition">
                    <h4 className="font-bold text-secondary text-sm">{a.title}</h4>
                    <p className="text-xs text-muted leading-6 mt-1">{a.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      {a.linkUrl ? (
                        <a
                          href={a.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline font-bold"
                        >
                          <LinkIcon className="w-3 h-3" />
                          فتح الرابط
                        </a>
                      ) : <span />}
                      <span className="text-[11px] text-muted">
                        {new Date(a.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnnouncementsBell
