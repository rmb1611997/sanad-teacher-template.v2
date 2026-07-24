import { motion } from "framer-motion"
import { ListChecks, ClipboardCheck, ShieldCheck, Headphones, Sparkles } from "lucide-react"
import { siteConfig } from "../../config/site"

const icons = [ListChecks, ClipboardCheck, ShieldCheck, Headphones]

function FeaturesSection() {
  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">

      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-104 h-104 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-88 h-88 rounded-full bg-primary/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--color-secondary) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4" />
            مميزات المنصة
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-extrabold text-secondary tracking-tight leading-tight">
            كل ما تحتاجه لـ
            <span className="relative inline-block text-primary mx-2">
              رحلتك التعليمية
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/10 rounded-full -z-10"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              />
            </span>
          </h2>
          <p className="mt-5 text-sm md:text-base text-muted max-w-xl mx-auto leading-7">
            منصة {siteConfig.name} توفر لك كل الأدوات اللي محتاجها
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteConfig.features.map((feature, index) => {
            const Icon = icons[index % icons.length]
            return (
              <motion.div
                key={feature.title}
                className="relative group"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
              >
                {/* Glow ring on hover */}
                <div className="absolute -inset-0.5 rounded-4xl bg-linear-to-br from-primary to-primary/40 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />

                {/* Card */}
                <motion.div
                  className="relative bg-card border border-border rounded-4xl p-7 h-full text-right overflow-hidden"
                  whileHover={{ y: -10, transition: { duration: 0.25, ease: "easeOut" } }}
                >
                  {/* Background gradient blob */}
                  <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 group-hover:scale-125 transition-all duration-500" />

                  {/* Icon */}
                  <motion.div
                    className="relative z-10 w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 mb-6"
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08, transition: { duration: 0.5 } }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-secondary mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted leading-7">
                      {feature.description}
                    </p>
                  </div>

                  {/* Bottom accent */}
                  <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                </motion.div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default FeaturesSection
