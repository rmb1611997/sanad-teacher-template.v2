import { apiFetch } from "./apiClient"
import type { ApiErrorShape } from "./apiClient"
import type { ComprehensiveReportFilters, ComprehensiveReportResponse } from "../types/report"

// Auth
// The backend issues the JWT exclusively as an HttpOnly session cookie now — these
// three endpoints never return the token itself in the response body.
export const login = async (phone: string, password: string, remember = false) => {
  return apiFetch("/sanad/v1/auth/login", {
    method: "POST",
    body: { username: phone, password, remember },
  })
}

export const logout = async () => {
  return apiFetch("/sanad/v1/auth/logout", { method: "POST" })
}

export const checkSession = async () => {
  return apiFetch("/sanad/v1/auth/session")
}

// Register
export const register = async (data: Record<string, unknown>) => {
  return apiFetch("/sanad/v1/register", {
    method: "POST",
    body: data,
  })
}

// Courses
export const getCourses = async (grade?: string) => {
  const path = grade
    ? `/sanad/v1/courses?grade=${encodeURIComponent(grade)}`
    : `/sanad/v1/courses`
  return apiFetch(path)
}

export const getCourse = async (id: number) => {
  return apiFetch(`/sanad/v1/courses/${id}`)
}

export const getCourseGroups = async (id: number) => {
  return apiFetch(`/sanad/v1/courses/${id}/groups`)
}

// Course Content
export const getCourseContent = async (id: number, token?: string) => {
  return apiFetch(`/sanad/v1/courses/${id}/content`, { token })
}

export const getVideo = async (id: number, token?: string) => {
  return apiFetch(`/sanad/v1/videos/${id}`, { token })
}

// Student
export const getMyCourses = async (token: string) => {
  return apiFetch(`/sanad/v1/my-courses`, { token })
}

export const getProfile = async (token: string) => {
  return apiFetch(`/sanad/v1/profile`, { token })
}

export const activateCode = async (code: string, token: string) => {
  return apiFetch(`/sanad/v1/activate-code`, {
    method: "POST",
    token,
    body: { code },
  })
}

export const generateCodes = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/generate-codes`, {
    method: "POST",
    token,
    body: data,
  })
}

// Teacher — Courses
export const teacherGetCourses = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/courses`, { token })
}

export const teacherCreateCourse = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/courses`, { method: "POST", token, body: data })
}

export const teacherUpdateCourse = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/courses/${id}`, { method: "PUT", token, body: data })
}

export const teacherDeleteCourse = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/courses/${id}`, { method: "DELETE", token })
}

// Teacher — Groups
export const teacherGetGroups = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/groups`, { token })
}

export const teacherCreateGroup = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/groups`, { method: "POST", token, body: data })
}

export const teacherUpdateGroup = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/groups/${id}`, { method: "PUT", token, body: data })
}

export const teacherDeleteGroup = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/groups/${id}`, { method: "DELETE", token })
}

export const teacherReorderGroups = async (groupIds: number[], token: string) => {
  return apiFetch(`/sanad/v1/teacher/groups/reorder`, {
    method: "POST",
    token,
    body: { groupIds },
  })
}

// Teacher — Videos
export const teacherGetVideos = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/videos`, { token })
}

export const teacherCreateVideo = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/videos`, { method: "POST", token, body: data })
}

export const teacherUpdateVideo = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/videos/${id}`, { method: "PUT", token, body: data })
}

export const teacherDeleteVideo = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/videos/${id}`, { method: "DELETE", token })
}

export const teacherReorderVideos = async (videoIds: number[], token: string) => {
  return apiFetch(`/sanad/v1/teacher/videos/reorder`, {
    method: "POST",
    token,
    body: { videoIds },
  })
}

export const teacherReorderContent = async (
  items: { id: number; type: "video" | "exam" | "assignment" }[],
  token: string
) => {
  return apiFetch(`/sanad/v1/teacher/content/reorder`, {
    method: "POST",
    token,
    body: { items },
  })
}

// Media
export const uploadMedia = async (file: File, token: string) => {
  const formData = new FormData()
  formData.append("file", file)
  return apiFetch(`/wp/v2/media`, {
    method: "POST",
    token,
    body: formData,
  })
}

// Categories
export const getCategories = async () => {
  return apiFetch(`/sanad/v1/categories`)
}

export const saveCategories = async (categories: string[], token: string) => {
  return apiFetch(`/sanad/v1/categories`, {
    method: "POST",
    token,
    body: { categories },
  })
}

// Teacher — Notes
export const teacherGetNotes = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/notes`, { token })
}
export const teacherCreateNote = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/notes`, { method: "POST", token, body: data })
}
export const teacherUpdateNote = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/notes/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteNote = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/notes/${id}`, { method: "DELETE", token })
}

// Teacher — Links
export const teacherGetLinks = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/links`, { token })
}
export const teacherCreateLink = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/links`, { method: "POST", token, body: data })
}
export const teacherUpdateLink = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/links/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteLink = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/links/${id}`, { method: "DELETE", token })
}

// Teacher — Announcements
export const teacherGetAnnouncements = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/announcements`, { token })
}
export const teacherCreateAnnouncement = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/announcements`, { method: "POST", token, body: data })
}
export const teacherUpdateAnnouncement = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/announcements/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteAnnouncement = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/announcements/${id}`, { method: "DELETE", token })
}

// Teacher — Students
export const teacherGetStudents = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/students`, { token })
}
export const teacherUpdateStudent = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/students/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteStudent = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/students/${id}`, { method: "DELETE", token })
}

// Teacher — Staff
export const teacherGetStaff = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/staff`, { token })
}
export const teacherCreateStaff = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/staff`, { method: "POST", token, body: data })
}
export const teacherUpdateStaff = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/staff/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteStaff = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/staff/${id}`, { method: "DELETE", token })
}
// Teacher — Subscriptions
export const teacherGetSubscriptions = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/subscriptions`, { token })
}
export const teacherCancelSubscription = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/subscriptions/cancel`, { method: "POST", token, body: data })
}
export const teacherBanStudent = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/subscriptions/ban`, { method: "POST", token, body: data })
}
export const teacherUnbanStudent = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/subscriptions/unban`, { method: "POST", token, body: data })
}

// Teacher — Codes
export const teacherGetCodes = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/codes`, { token })
}
export const teacherGetCodeDetails = async (code: string, token: string) => {
  return apiFetch(`/sanad/v1/teacher/codes/details?code=${code}`, { token })
}

// Student — Announcements
export const getAnnouncements = async () => {
  return apiFetch(`/sanad/v1/announcements`)
}

// Teacher — Question Groups
export const teacherGetQuestionGroups = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/question-groups`, { token })
}
export const teacherCreateQuestionGroup = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/question-groups`, { method: "POST", token, body: data })
}
export const teacherUpdateQuestionGroup = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/question-groups/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteQuestionGroup = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/question-groups/${id}`, { method: "DELETE", token })
}

// Teacher — Questions
export const teacherGetQuestions = async (token: string, groupId?: number) => {
  const path = groupId
    ? `/sanad/v1/teacher/questions?groupId=${groupId}`
    : `/sanad/v1/teacher/questions`
  return apiFetch(path, { token })
}
export const teacherCreateQuestion = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/questions`, { method: "POST", token, body: data })
}
export const teacherUpdateQuestion = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/questions/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteQuestion = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/questions/${id}`, { method: "DELETE", token })
}

// Teacher — Exams
export const teacherGetExams = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/exams`, { token })
}
export const teacherCreateExam = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/exams`, { method: "POST", token, body: data })
}
export const teacherUpdateExam = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/exams/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteExam = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/exams/${id}`, { method: "DELETE", token })
}

// Teacher — Assignments
export const teacherGetAssignments = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/assignments`, { token })
}
export const teacherCreateAssignment = async (data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/assignments`, { method: "POST", token, body: data })
}
export const teacherUpdateAssignment = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/teacher/assignments/${id}`, { method: "PUT", token, body: data })
}
export const teacherDeleteAssignment = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/assignments/${id}`, { method: "DELETE", token })
}

// Student — Exam
export const getExam = async (id: number, token?: string) => {
  return apiFetch(`/sanad/v1/exams/${id}`, { token })
}
export const submitExam = async (id: number, payload: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/exams/${id}/submit`, {
    method: "POST",
    token,
    body: payload,
  })
}

// Student — Assignment
export const getAssignment = async (id: number, token?: string) => {
  return apiFetch(`/sanad/v1/assignments/${id}`, { token })
}
export const submitAssignment = async (id: number, data: Record<string, unknown>, token: string) => {
  return apiFetch(`/sanad/v1/assignments/${id}/submit`, {
    method: "POST",
    token,
    body: data,
  })
}

// Video Progress
export const updateVideoProgress = async (id: number, watchPercent: number, token: string) => {
  return apiFetch(`/sanad/v1/videos/${id}/progress`, {
    method: "POST",
    token,
    body: { watchPercent },
  })
}

// Teacher Stats
export const teacherGetVideoStats = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/stats/videos/${id}`, { token })
}

export const teacherGetExamStats = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/stats/exams/${id}`, { token })
}

export const teacherGetAssignmentStats = async (id: number, token: string) => {
  return apiFetch(`/sanad/v1/teacher/stats/assignments/${id}`, { token })
}

// Student — My Stats
export const getStudentStats = async (token: string) => {
  return apiFetch(`/sanad/v1/student/stats`, { token })
}

export const getStudentActivityLog = async (token: string) => {
  return apiFetch(`/sanad/v1/student/activity-log`, { token })
}

export const getStudentCourseProgress = async (token: string) => {
  return apiFetch(`/sanad/v1/student/course-progress`, { token })
}

export const teacherGetOverviewStats = async (token: string) => {
  return apiFetch(`/sanad/v1/teacher/stats/overview`, { token })
}

// Teacher — Comprehensive Reports (server-side filtered/paginated per-student rollup).
// Backend endpoint not implemented yet — the page built around this call is ready to
// consume it as soon as it exists, without any frontend changes.
export const teacherGetComprehensiveReport = async (
  filters: ComprehensiveReportFilters,
  token: string
) => {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.phone) params.set("phone", filters.phone)
  if (filters.grade) params.set("grade", filters.grade)
  if (filters.courseId) params.set("course_id", String(filters.courseId))
  if (filters.level?.min != null) params.set("level_min", String(filters.level.min))
  if (filters.level?.max != null) params.set("level_max", String(filters.level.max))
  if (filters.watchPercent?.min != null) params.set("watch_min", String(filters.watchPercent.min))
  if (filters.watchPercent?.max != null) params.set("watch_max", String(filters.watchPercent.max))
  if (filters.examCompletionPercent?.min != null) params.set("exam_completion_min", String(filters.examCompletionPercent.min))
  if (filters.examCompletionPercent?.max != null) params.set("exam_completion_max", String(filters.examCompletionPercent.max))
  if (filters.examAvgPercent?.min != null) params.set("exam_avg_min", String(filters.examAvgPercent.min))
  if (filters.examAvgPercent?.max != null) params.set("exam_avg_max", String(filters.examAvgPercent.max))
  if (filters.sortField) params.set("sort_field", filters.sortField)
  if (filters.sortDir) params.set("sort_dir", filters.sortDir)
  params.set("page", String(filters.page ?? 1))
  params.set("page_size", String(filters.pageSize ?? 20))
  return apiFetch<ComprehensiveReportResponse | ApiErrorShape>(
    `/sanad/v1/teacher/reports/comprehensive?${params.toString()}`,
    { token }
  )
}
