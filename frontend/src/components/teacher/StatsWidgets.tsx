import { useEffect, useState } from "react"
import { motion, animate } from "framer-motion"
import { BarChart3 } from "lucide-react"

// Shared between the teacher Home and Statistics pages so neither duplicates these building blocks.

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value])

  return <>{display}</>
}

export function StatCard({ label, value, suffix, icon: Icon, gradient, delay }: {
  label: string
  value: number
  suffix?: string
  icon: React.ElementType
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl p-5 flex items-center justify-between border border-border ${gradient}`}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <motion.div
        className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 relative z-10"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: delay + 0.15, type: "spring", stiffness: 200 }}
      >
        <Icon className="w-6 h-6 text-white" />
      </motion.div>
      <div className="text-right relative z-10">
        <p className="text-xs text-white/70">{label}</p>
        <p className="text-2xl font-extrabold text-white mt-1">
          <AnimatedNumber value={value} />
          {suffix}
        </p>
      </div>
    </motion.div>
  )
}

export function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-muted">
      <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs mt-1">لا توجد بيانات كافية لعرضها الآن</p>
    </div>
  )
}

export function ChartCard({ title, icon: Icon, iconColor, delay, children }: {
  title: string
  icon: React.ElementType
  iconColor: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      className="bg-card border border-border rounded-3xl p-6"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay }}
    >
      <h2 className="font-bold text-secondary text-lg text-right mb-6 flex items-center gap-2 justify-end">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h2>
      {children}
    </motion.div>
  )
}
