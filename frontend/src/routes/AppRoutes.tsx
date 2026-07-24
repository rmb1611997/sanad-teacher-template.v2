import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import { Loader2 } from "lucide-react"
import PublicLayout from "../components/layouts/PublicLayout"
import AuthLayout from "../components/layouts/AuthLayout"
import ProtectedRoute from "./ProtectedRoute"

const Courses = lazy(() => import("../pages/Courses"))
const Home = lazy(() => import("../pages/Home"))
const Login = lazy(() => import("../pages/Login"))
const Register = lazy(() => import("../pages/Register"))
const CourseDetails = lazy(() => import("../pages/CourseDetails"))
const TeacherLayout = lazy(() => import("../components/layouts/TeacherLayout"))
const CourseManager = lazy(() => import("../pages/teacher/CourseManager"))
const GroupManager = lazy(() => import("../pages/teacher/GroupManager"))
const VideoManager = lazy(() => import("../pages/teacher/VideoManager"))
const NoteManager = lazy(() => import("../pages/teacher/NoteManager"))
const LinkManager = lazy(() => import("../pages/teacher/LinkManager"))
const QuestionGroupManager = lazy(() => import("../pages/teacher/QuestionGroupManager"))
const QuestionBank = lazy(() => import("../pages/teacher/QuestionBank"))
const AnnouncementManager = lazy(() => import("../pages/teacher/AnnouncementManager"))
const StaffManager = lazy(() => import("../pages/teacher/StaffManager"))
const StudentManager = lazy(() => import("../pages/teacher/StudentManager"))
const StudentCodeDetails = lazy(() => import("../pages/teacher/StudentCodeDetails"))
const StudentDataEditor = lazy(() => import("../pages/teacher/StudentDataEditor"))
const SubscriptionManager = lazy(() => import("../pages/teacher/SubscriptionManager"))
const CodeManager = lazy(() => import("../pages/teacher/CodeManager"))
const CodeDetails = lazy(() => import("../pages/teacher/CodeDetails"))
const SubscriptionControl = lazy(() => import("../pages/teacher/SubscriptionControl"))
const Statistics = lazy(() => import("../pages/teacher/Statistics"))
const TeacherHome = lazy(() => import("../pages/teacher/TeacherHome"))
const CourseContentManager = lazy(() => import("../pages/teacher/CourseContentManager"))
const ExamPage = lazy(() => import("../pages/ExamPage"))
const AssignmentPage = lazy(() => import("../pages/AssignmentPage"))
const VideoPage = lazy(() => import("../pages/VideoPage"))
const ExamManager = lazy(() => import("../pages/teacher/ExamManager"))
const AssignmentManager = lazy(() => import("../pages/teacher/AssignmentManager"))
const ExamAssignmentStats = lazy(() => import("../pages/teacher/ExamAssignmentStats"))
const VideoStats = lazy(() => import("../pages/teacher/VideoStats"))
const ComprehensiveReports = lazy(() => import("../pages/teacher/ComprehensiveReports"))
const CourseCategoryManager = lazy(() => import("../pages/teacher/CourseCategoryManager"))
const StudentCourses = lazy(() => import("../pages/StudentCourses"))
const StudentDashboard = lazy(() => import("../pages/StudentDashboard"))
const StudentStats = lazy(() => import("../pages/StudentStats"))
const StudentProfile = lazy(() => import("../pages/StudentProfile"))
const NotFound = lazy(() => import("../pages/NotFound"))

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>

        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/exam/:id" element={<ExamPage />} />
          <Route path="/assignment/:id" element={<AssignmentPage />} />
          <Route path="/watch/:id" element={<VideoPage />} />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute role="student">
                <StudentCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-courses"
            element={
              <ProtectedRoute role="student">
                <StudentCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-stats"
            element={
              <ProtectedRoute role="student">
                <StudentStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-stats"
            element={
              <ProtectedRoute role="student">
                <StudentStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="student">
                <StudentProfile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherHome />} />
          <Route path="courses" element={<CourseManager />} />
          <Route path="groups" element={<GroupManager />} />
          <Route path="videos" element={<VideoManager />} />
          <Route path="notes" element={<NoteManager />} />
          <Route path="links" element={<LinkManager />} />
          <Route path="question-groups" element={<QuestionGroupManager />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="announcements" element={<AnnouncementManager />} />
          <Route path="staff" element={<StaffManager />} />
          <Route path="students" element={<StudentManager />} />
          <Route path="student-code-details" element={<StudentCodeDetails />} />
          <Route path="edit-student" element={<StudentDataEditor />} />
          <Route path="subscriptions" element={<SubscriptionManager />} />
          <Route path="codes" element={<CodeManager />} />
          <Route path="code-details" element={<CodeDetails />} />
          <Route path="subscription-control" element={<SubscriptionControl />} />
          <Route path="reports" element={<Statistics />} />
          <Route path="course-content" element={<CourseContentManager />} />
          <Route path="exams" element={<ExamManager />} />
          <Route path="assignments" element={<AssignmentManager />} />
          <Route path="exam-stats" element={<ExamAssignmentStats />} />
          <Route path="video-stats" element={<VideoStats />} />
          <Route path="comprehensive-reports" element={<ComprehensiveReports />} />
          <Route path="categories" element={<CourseCategoryManager />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  )
}

export default AppRoutes
