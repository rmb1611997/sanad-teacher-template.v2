import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Megaphone, X, Link as LinkIcon } from "lucide-react"
import { useAuth } from "../../context/useAuth"
import { getAnnouncements } from "../../services/api"

interface Announcement {
  id: number
  title: string
  content: string
  linkUrl?: string
  createdAt: string
}

const DISMISSED_KEY = "sanad_dismissed_announcements"

function getDismissedIds(): number[] {
  try {
    const saved = localStorage.getItem(DISMISSED_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

/** Shows the newest not-yet-seen announcement as a dismissible banner; once closed it won't reappear (still available in the bell). */
function AnnouncementBanner() {
  const { isLoggedIn, user } = useAuth()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    if (!isLoggedIn || user?.role === "teacher") return
    getAnnouncements().then((data) => {
      if (!Array.isArray(data) || data.length === 0) return
      const dismissed = getDismissedIds()
      const newest = [...data].sort(
        (a: Announcement, b: Announcement) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      if (newest && !dismissed.includes(newest.id)) setAnnouncement(newest)
    })
  }, [isLoggedIn, user?.role])

  function dismiss() {
    if (!announcement) return
    const dismissed = getDismissedIds()
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, announcement.id]))
    setAnnouncement(null)
  }

  return (
    <AnimatePresence>
      {announcement && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden"
        >
          <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-3">
            <div className="relative flex items-start gap-3 bg-primary/10 border border-primary/25 rounded-2xl px-4 py-3.5 sm:px-5">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Megaphone className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0 text-right">
                <h4 className="font-bold text-secondary text-sm">{announcement.title}</h4>
                <p className="text-xs text-muted leading-6 mt-0.5">{announcement.content}</p>
                {announcement.linkUrl && (
                  <a
                    href={announcement.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold mt-1.5"
                  >
                    <LinkIcon className="w-3 h-3" />
                    فتح الرابط
                  </a>
                )}
              </div>

              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition shrink-0"
                title="إغلاق"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AnnouncementBanner
