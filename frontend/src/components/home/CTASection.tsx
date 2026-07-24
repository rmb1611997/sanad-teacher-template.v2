import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Play, ArrowLeft, Sparkles } from "lucide-react"
import { siteConfig } from "../../config/site"
import { useAuth } from "../../context/useAuth"

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([^#&?]{11})/)
  return match ? match[1] : null
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null
}

function CTASection() {
  const { isLoggedIn } = useAuth()
  const videoUrl = siteConfig.cta.videoUrl
  const thumbnail = videoUrl ? getYouTubeThumbnail(videoUrl) : null

  return (
    <section className="relative py-20 md:py-28 bg-primary overflow-hidden">

      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-dark/40 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 ${videoUrl ? "grid lg:grid-cols-2 gap-12 items-center" : ""}`}>

        {/* Text */}
        <motion.div
          className={videoUrl ? "text-center lg:text-right" : "text-center"}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4" />
            انضم إلينا اليوم
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            ابدأ رحلتك التعليمية مع {siteConfig.teacher.name}
          </h2>

          <p className="mt-5 text-white/80 text-sm md:text-lg leading-7 md:leading-8 max-w-xl mx-auto lg:mx-0">
            انضم إلى منصة {siteConfig.name} واستمتع بتجربة تعليمية
            منظمة ومتابعة أفضل في مادة {siteConfig.teacher.subject}.
          </p>

          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-black/10 hover:opacity-90 hover:shadow-xl transition-all"
              >
                إنشاء حساب
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Video Preview — controlled from siteConfig.cta.videoUrl */}
        {videoUrl && (
          <motion.a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block rounded-3xl overflow-hidden aspect-video shadow-2xl shadow-black/30 border-4 border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt="فيديو تعريفي"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-primary-dark flex items-center justify-center">
                <Play className="w-16 h-16 text-white/40" />
              </div>
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="absolute w-20 h-20 rounded-full bg-white/30"
                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Play className="w-8 h-8 text-primary -mr-0.5" fill="currentColor" />
              </motion.div>
            </div>
          </motion.a>
        )}

      </div>

    </section>
  )
}

export default CTASection
