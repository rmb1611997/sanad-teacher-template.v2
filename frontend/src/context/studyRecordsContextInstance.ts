import { createContext } from "react"

export interface VideoLogEntry {
  id: string
  courseTitle: string
  videoTitle: string
  watchedAt: string
}

export interface ExamLogEntry {
  id: string
  courseTitle: string
  examTitle: string
  score: number
  total: number
  submittedAt: string
}

export interface AssignmentLogEntry {
  id: string
  courseTitle: string
  assignmentTitle: string
  grade: number | null
  submittedAt: string
}

export interface StudyRecordsContextType {
  videoLogs: VideoLogEntry[]
  examLogs: ExamLogEntry[]
  assignmentLogs: AssignmentLogEntry[]
  logVideoWatch: (entry: Omit<VideoLogEntry, "id" | "watchedAt">) => void
  logExamResult: (entry: Omit<ExamLogEntry, "id" | "submittedAt">) => void
  logAssignmentSubmission: (entry: Omit<AssignmentLogEntry, "id" | "submittedAt">) => void
}

export const StudyRecordsContext = createContext<StudyRecordsContextType | null>(null)
