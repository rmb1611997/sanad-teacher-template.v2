export type LessonType = "video" | "file" | "exam" | "assignment" | "link" | "note"

export interface CourseLesson {
  id: number
  title: string
  type: LessonType
  description?: string
  duration?: string
  isLocked: boolean
  url?: string
  dueDate?: string
  isSubmitted?: boolean
}

export interface CourseGroup {
  id: number
  title: string
  description?: string
  lessons: CourseLesson[]
}

export interface Course {
  id: number
  title: string
  description: string
  image: string
  grade: string
  category?: string
  price: number
  discountPrice?: number
  createdAt: string
  updatedAt: string
  groups?: CourseGroup[]
}

export interface TeacherGroupRef {
  id: number
  courseId: number
  name: string
}

// Raw shape returned by GET /courses/:id/content, shared by CourseDetails.tsx and
// CourseLearn.tsx (both fetch via getCourseContent and previously redefined this
// locally with the exact same field names).
export interface ApiCourseDetails {
  id: number
  title: string
  description: string
  grade: string
  price: number
  discountPrice?: number
  isFree?: boolean
  image: string
  createdAt: string
  updatedAt: string
}

export interface ApiCourseLesson {
  id: number
  title: string
  type: LessonType
  description?: string | null
  duration?: string | number
  isLocked: boolean
  url?: string | null
  dueDate?: string | null
  isSubmitted?: boolean
}

export interface ApiCourseGroup {
  id: number
  title: string
  description?: string | null
  lessons: ApiCourseLesson[]
}

export interface CourseContentApiResponse {
  course: ApiCourseDetails
  isEnrolled: boolean
  isFree: boolean
  groups: ApiCourseGroup[]
}

export interface VideoItem {
  id: string
  groupId: number
  courseId: number
  grade: string
  title: string
  description?: string
  duration: string
  provider: "YouTube" | "Vimeo" | "Bunny"
  url: string
  thumbnailUrl?: string
  showFrom?: string
  showFromTime?: string
  hideTo?: string
  hideToTime?: string
  isFree: boolean
  isGate?: boolean
}