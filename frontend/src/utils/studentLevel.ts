import type { StudentReportRow } from "../types/report"

// Student level is always derived at runtime from the four real performance
// components — never read from a stored DB value.
export function computeStudentLevel(row: StudentReportRow): number {
  const avg =
    (row.videoCompletionPercent + row.avgWatchPercent + row.examCompletionPercent + row.avgExamScorePercent) / 4
  return Math.round(avg)
}

export interface StudentRating {
  label: string
  className: string
}

export function getStudentRating(level: number): StudentRating {
  if (level <= 25) return { label: "ضعيف جداً", className: "text-red-600 bg-red-50 border-red-200" }
  if (level <= 50) return { label: "ضعيف", className: "text-orange-600 bg-orange-50 border-orange-200" }
  if (level <= 70) return { label: "متوسط", className: "text-amber-600 bg-amber-50 border-amber-200" }
  if (level <= 80) return { label: "جيد", className: "text-sky-600 bg-sky-50 border-sky-200" }
  if (level <= 90) return { label: "جيد جداً", className: "text-emerald-600 bg-emerald-50 border-emerald-200" }
  return { label: "ممتاز", className: "text-primary bg-primary/10 border-primary/20" }
}
