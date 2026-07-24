import { useContext } from "react"
import { StudyRecordsContext } from "./studyRecordsContextInstance"

export function useStudyRecords() {
  const context = useContext(StudyRecordsContext)
  if (!context) throw new Error("useStudyRecords must be used within StudyRecordsProvider")
  return context
}
