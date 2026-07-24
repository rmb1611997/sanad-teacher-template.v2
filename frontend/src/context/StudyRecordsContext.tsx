import { useState, type ReactNode } from "react"
import {
  StudyRecordsContext,
  type VideoLogEntry,
  type ExamLogEntry,
  type AssignmentLogEntry,
} from "./studyRecordsContextInstance"
import { useAuth } from "./useAuth"

function loadFromStorage<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function StudyRecordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userKey = user ? String(user.id) : "guest"

  const [prevUserKey, setPrevUserKey] = useState(userKey)
  const [videoLogs, setVideoLogs] = useState<VideoLogEntry[]>(() => loadFromStorage(`sanad_video_logs_${userKey}`))
  const [examLogs, setExamLogs] = useState<ExamLogEntry[]>(() => loadFromStorage(`sanad_exam_logs_${userKey}`))
  const [assignmentLogs, setAssignmentLogs] = useState<AssignmentLogEntry[]>(() => loadFromStorage(`sanad_assignment_logs_${userKey}`))

  // Reload the logs whenever the logged-in account changes, so one account never sees another's activity
  if (userKey !== prevUserKey) {
    setPrevUserKey(userKey)
    setVideoLogs(loadFromStorage(`sanad_video_logs_${userKey}`))
    setExamLogs(loadFromStorage(`sanad_exam_logs_${userKey}`))
    setAssignmentLogs(loadFromStorage(`sanad_assignment_logs_${userKey}`))
  }

  function logVideoWatch(entry: Omit<VideoLogEntry, "id" | "watchedAt">) {
    const newEntry: VideoLogEntry = { ...entry, id: "vlog-" + Date.now(), watchedAt: new Date().toISOString() }
    setVideoLogs((prev) => {
      const next = [newEntry, ...prev]
      localStorage.setItem(`sanad_video_logs_${userKey}`, JSON.stringify(next))
      return next
    })
  }

  function logExamResult(entry: Omit<ExamLogEntry, "id" | "submittedAt">) {
    const newEntry: ExamLogEntry = { ...entry, id: "elog-" + Date.now(), submittedAt: new Date().toISOString() }
    setExamLogs((prev) => {
      const next = [newEntry, ...prev]
      localStorage.setItem(`sanad_exam_logs_${userKey}`, JSON.stringify(next))
      return next
    })
  }

  function logAssignmentSubmission(entry: Omit<AssignmentLogEntry, "id" | "submittedAt">) {
    const newEntry: AssignmentLogEntry = { ...entry, id: "alog-" + Date.now(), submittedAt: new Date().toISOString() }
    setAssignmentLogs((prev) => {
      const next = [newEntry, ...prev]
      localStorage.setItem(`sanad_assignment_logs_${userKey}`, JSON.stringify(next))
      return next
    })
  }

  return (
    <StudyRecordsContext.Provider
      value={{ videoLogs, examLogs, assignmentLogs, logVideoWatch, logExamResult, logAssignmentSubmission }}
    >
      {children}
    </StudyRecordsContext.Provider>
  )
}
