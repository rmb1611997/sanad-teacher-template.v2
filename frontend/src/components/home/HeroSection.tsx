import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowLeft, Sparkles, GraduationCap } from "lucide-react"
import { siteConfig } from "../../config/site"
import { useAuth } from "../../context/useAuth"

function HeroSection() {
  const { isLoggedIn } = useAuth()

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">

      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--color-secondary) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-10 items-center min-h-screen pt-5">

        {/* Right — Text */}
        <motion.div
          className="text-right"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Eyebrow */}
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4" />
            رحلة تعليمية ممتعة
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold text-primary dark:text-white leading-tight mt-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {siteConfig.hero.title}
          </motion.h1>

          <motion.p
            className="mt-4 text-xl md:text-2xl font-bold text-secondary"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            مع {siteConfig.teacher.name}
          </motion.p>

          <motion.div
            className="inline-flex items-center gap-2 bg-card border border-border text-primary font-bold px-4 py-1.5 rounded-full text-sm mt-5 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <GraduationCap className="w-4 h-4" />
            مدرس {siteConfig.teacher.subject}
          </motion.div>

          <motion.p
            className="mt-5 text-lg text-muted leading-8 max-w-lg mr-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            {siteConfig.teacher.bio}
          </motion.p>

          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 bg-primary text-white px-4 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:opacity-90 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                ابدأ رحلتك الآن
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Left — Teacher with Circle */}
        <div className="relative shrink-0 z-10 w-full flex justify-center py-10 lg:py-0 lg:-translate-y-15">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative w-80 h-80 sm:w-88 sm:h-88 md:w-88 md:h-88 lg:w-130 lg:h-130 max-w-full flex items-end justify-center"
          >
            {/* Continuous Float */}
            <motion.div
              className="absolute inset-0 flex items-end justify-center"
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 4.5, delay: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Background Glows */}
              <div className="absolute top-[20%] w-[80%] h-[80%] bg-primary/25 rounded-full blur-[100px] animate-pulse" />
              <div className="absolute top-[20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[80px] animate-pulse [animation-delay:700ms]" />

              {/* Dashed Ring */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 left-[4%] right-[4%] aspect-square rounded-full border-2 border-dashed border-primary/25"
                animate={{ rotate: 600 }}
                transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
              />

              {/* The Main Decorative Circle */}
              <motion.div
                animate={{ scale: [1, 1.02, 1], rotate: [0, 2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-[12%] right-[12%] aspect-square rounded-full bg-primary shadow-[0_0_60px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] border-8 border-card"
              />

              {/* Instructor Image Wrapper (Syncs Hover for both layers) */}
              <motion.div
                className="absolute inset-0 z-10"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Layer 1: Bottom half (Clipped by circle) */}
                <div className="absolute bottom-2 left-[calc(12%+8px)] right-[calc(12%+8px)] aspect-square rounded-full overflow-hidden flex items-end justify-center">
                  <img
                    src={siteConfig.teacher.image}
                    alt={siteConfig.teacher.name}
                    className="w-full h-[125%] object-cover object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                  />
                </div>

                {/* Layer 2: Top half (Pop-out, no limits) */}
                <div
                  className="absolute bottom-2 left-[calc(12%+8px)] right-[calc(12%+8px)] aspect-square flex items-end justify-center pointer-events-none"
                  style={{ clipPath: "inset(-100% -100% 50% -100%)" }}
                >
                  <img
                    src={siteConfig.teacher.image}
                    alt={siteConfig.teacher.name}
                    className="w-full h-[125%] object-cover object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

      </div>

    </section>
  )
}

export default HeroSection
