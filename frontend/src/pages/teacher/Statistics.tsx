import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, BookOpen, TrendingUp, Award, Calendar, Medal, UserCheck, MapPin } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { useAuth } from "../../context/useAuth"
import { teacherGetStudents, teacherGetSubscriptions, teacherGetOverviewStats } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import { StatCard, EmptyChart, ChartCard } from "../../components/teacher/StatsWidgets"

interface ApiSubscription {
  studentId: number
  courseTitle: string
}

interface NamedCount {
  name: string
  students: number
}

interface GovernorateCount {
  name: string
  value: number
}

interface SubscriptionPoint {
  date: string
  count: number
}

const RANK_STYLES = [
  { bg: "bg-linear-to-br from-amber-300 to-amber-500", ring: "ring-amber-300/50", text: "text-amber-600" },
  { bg: "bg-linear-to-br from-slate-300 to-slate-400", ring: "ring-slate-300/50", text: "text-slate-500" },
  { bg: "bg-linear-to-br from-orange-400 to-orange-600", ring: "ring-orange-300/50", text: "text-orange-600" },
]

const GOVERNORATE_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#d97706", "#059669", "#db2777", "#4f46e5", "#dc2626"]

function DonutCard({ title, icon: Icon, iconColor, delay, centerLabel, centerValue, data, colors, empty }: {
  title: string
  icon: React.ElementType
  iconColor: string
  delay: number
  centerLabel: string
  centerValue: string
  data: { name: string; value: number }[]
  colors: string[]
  empty: boolean
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0)

  return (
    <ChartCard title={title} icon={Icon} iconColor={iconColor} delay={delay}>
      {empty ? (
        <EmptyChart label="لا توجد بيانات" />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-52 h-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={3}
                  cornerRadius={8}
                  dataKey="value"
                  animationBegin={100}
                  animationDuration={900}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, "طالب"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-secondary">{centerValue}</span>
              <span className="text-xs text-muted mt-1">{centerLabel}</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {data.map((d, i) => (
              <motion.div
                key={d.name}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: delay + 0.1 + i * 0.06, duration: 0.4 }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-sm font-bold text-secondary flex-1 truncate">{d.name}</span>
                <div className="w-16 bg-border rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: delay + 0.2 + i * 0.06, duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-bold text-muted w-8 text-left">{d.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  )
}

type Period = "week" | "month" | "all"

function Statistics() {
  const [period, setPeriod] = useState<Period>("all")
  const { getToken } = useAuth()

  const { courses } = useTeacherCoursesGroups(getToken())
  const [totalStudents, setTotalStudents] = useState(0)
  const [subscribedStudents, setSubscribedStudents] = useState(0)
  const [studentsPerCourse, setStudentsPerCourse] = useState<NamedCount[]>([])
  const [topCourses, setTopCourses] = useState<NamedCount[]>([])
  const [subscriptionsOverTime, setSubscriptionsOverTime] = useState<SubscriptionPoint[]>([])
  const [governorateData, setGovernorateData] = useState<GovernorateCount[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetStudents(token).then((data) => { if (Array.isArray(data)) setTotalStudents(data.length) })
    teacherGetSubscriptions(token).then((data) => {
      if (Array.isArray(data)) {
        const subscriptions = data as ApiSubscription[]
        const uniqueStudents = new Set(subscriptions.map((s) => s.studentId))
        setSubscribedStudents(uniqueStudents.size)
      }
    })
    teacherGetOverviewStats(token).then((data) => {
      if (data.studentsPerCourse) {
        setStudentsPerCourse(data.studentsPerCourse)
        setTopCourses(data.topCourses)
        setSubscriptionsOverTime(data.subscriptionsOverTime)
        setGovernorateData(data.governorateData || [])
      }
    })
  }, [getToken])

  const subscribedPercent = totalStudents > 0
    ? Math.round((subscribedStudents / totalStudents) * 100)
    : 0

  const enrollmentData = [
    { name: "مشتركون في كورسات", value: subscribedStudents },
    { name: "مسجلون فقط", value: Math.max(totalStudents - subscribedStudents, 0) },
  ]

  return (
    <div className="space-y-6">

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الطلاب" value={totalStudents} icon={Users} gradient="bg-linear-to-br from-blue-500 to-blue-700" delay={0} />
        <StatCard label="المشتركون في كورسات" value={subscribedStudents} icon={TrendingUp} gradient="bg-linear-to-br from-emerald-500 to-emerald-700" delay={0.08} />
        <StatCard label="عدد الكورسات" value={courses.length} icon={BookOpen} gradient="bg-linear-to-br from-amber-500 to-amber-700" delay={0.16} />
        <StatCard label="نسبة الاشتراك" value={subscribedPercent} suffix="%" icon={Award} gradient="bg-linear-to-br from-purple-500 to-purple-700" delay={0.24} />
      </div>

      {/* Enrollment + Governorate Donuts */}
      <div className="grid md:grid-cols-2 gap-6">
        <DonutCard
          title="المشتركون مقابل المسجلين فقط"
          icon={UserCheck}
          iconColor="text-emerald-500"
          delay={0.1}
          centerLabel="نسبة الاشتراك"
          centerValue={`${subscribedPercent}%`}
          data={enrollmentData}
          colors={["#059669", "#e2e8f0"]}
          empty={totalStudents === 0}
        />

        <DonutCard
          title="توزيع الطلاب بالمحافظات"
          icon={MapPin}
          iconColor="text-primary"
          delay={0.15}
          centerLabel="إجمالي الطلاب"
          centerValue={`${governorateData.reduce((acc, g) => acc + g.value, 0)}`}
          data={governorateData}
          colors={GOVERNORATE_COLORS}
          empty={governorateData.length === 0}
        />
      </div>

      {/* Subscriptions Over Time */}
      <ChartCard title="الاشتراكات عبر الزمن" icon={Calendar} iconColor="text-primary" delay={0.1}>
        <div className="flex justify-end mb-4">
          <div className="flex gap-2 bg-background border border-border rounded-xl p-1">
            {([
              { id: "week", label: "الأسبوع" },
              { id: "month", label: "الشهر" },
              { id: "all", label: "الكل" },
            ] as { id: Period; label: string }[]).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  period === p.id ? "bg-primary text-white" : "text-muted hover:text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {subscriptionsOverTime.length === 0 ? (
          <EmptyChart label="لا توجد بيانات اشتراكات" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subscriptionsOverTime}>
              <defs>
                <linearGradient id="subsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--color-primary)", opacity: 0.08 }}
                formatter={(value) => [`${value}`, "اشتراكات"]}
                labelFormatter={(label) => `تاريخ: ${label}`}
              />
              <Bar dataKey="count" fill="url(#subsGradient)" radius={[8, 8, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Students Per Course + Top Courses */}
      <div className="grid md:grid-cols-2 gap-6">

        <ChartCard title="الطلاب في كل كورس" icon={BookOpen} iconColor="text-primary" delay={0.15}>
          {studentsPerCourse.length === 0 ? (
            <EmptyChart label="لا توجد بيانات" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={studentsPerCourse}>
                <defs>
                  <linearGradient id="courseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-primary)", opacity: 0.08 }}
                  formatter={(value) => [`${value}`, "عدد الطلاب"]}
                />
                <Bar dataKey="students" fill="url(#courseGradient)" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="أكثر الكورسات مبيعاً" icon={Award} iconColor="text-amber-500" delay={0.2}>
          {topCourses.length === 0 ? (
            <EmptyChart label="لا توجد بيانات" />
          ) : (
            <div className="space-y-3">
              {topCourses.slice(0, 5).map((course, i) => {
                const rank = RANK_STYLES[i]
                return (
                  <motion.div
                    key={course.name}
                    className={`flex items-center gap-3 p-3 rounded-2xl border ${
                      rank ? "border-transparent bg-background shadow-sm" : "border-border"
                    }`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                      rank ? `${rank.bg} text-white ring-4 ${rank.ring}` : "bg-primary/10 text-primary"
                    }`}>
                      {rank ? <Medal className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="font-bold text-secondary text-sm flex-1 truncate">{course.name}</span>
                    <div className="w-20 bg-border rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${rank ? rank.bg : "bg-primary"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(course.students / (topCourses[0]?.students || 1)) * 100}%` }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-8 text-left ${rank ? rank.text : "text-primary"}`}>
                      {course.students}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </ChartCard>

      </div>

    </div>
  )
}

export default Statistics
