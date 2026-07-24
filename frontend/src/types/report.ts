// Types for the "Comprehensive Reports" page (per-student cross-content performance rollup).
// The values below are the raw inputs the level formula needs — the level/rating themselves
// are always computed at runtime on the frontend, never trusted from a stored DB value.

export interface StudentReportRow {
  id: number
  name: string
  phone: string
  parentPhone?: string
  grade?: string
  avatar?: string | null
  videosWatchedCount: number
  videosTotalCount: number
  avgWatchPercent: number
  examsSolvedCount: number
  examsTotalCount: number
  avgExamScorePercent: number
  totalWatchTimeMinutes: number
  videoCompletionPercent: number
  examCompletionPercent: number
  lastActivityAt: string | null
}

export interface ReportRange {
  min?: number
  max?: number
}

export interface ComprehensiveReportFilters {
  search?: string
  phone?: string
  grade?: string
  courseId?: number
  level?: ReportRange
  watchPercent?: ReportRange
  examCompletionPercent?: ReportRange
  examAvgPercent?: ReportRange
  sortField?: string
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface ComprehensiveReportResponse {
  rows: StudentReportRow[]
  total: number
  page: number
  pageSize: number
  topStudents: StudentReportRow[]
}
