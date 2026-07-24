import { useEffect, useState } from "react"
import { teacherGetCourses, teacherGetGroups } from "../services/api"
import type { Course, TeacherGroupRef } from "../types/course"

/**
 * Shared by every teacher "manager" page: loads the teacher's courses and groups
 * (used to populate the grade/course/group selectors) whenever the auth token changes.
 */
export function useTeacherCoursesGroups(token: string | null) {
  const [courses, setCourses] = useState<Course[]>([])
  const [groups, setGroups] = useState<TeacherGroupRef[]>([])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    teacherGetCourses(token).then((data) => {
      if (!cancelled && Array.isArray(data)) setCourses(data)
    })

    teacherGetGroups(token).then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setGroups(
          data.map((g: { id: number; courseId: number; title: string }) => ({
            id: g.id,
            courseId: g.courseId,
            name: g.title,
          }))
        )
      }
    })

    return () => {
      cancelled = true
    }
  }, [token])

  return { courses, groups }
}

export default useTeacherCoursesGroups
