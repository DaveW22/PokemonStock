import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.18),_transparent_35%),linear-gradient(135deg,rgba(15,14,39,0.98),rgba(8,8,23,0.96))] p-8 shadow-2xl shadow-black/30"
    >
      <div className="absolute -right-10 top-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-24 h-36 w-36 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Safe & Compliant
            </span>
            <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              Manual purchase only
            </span>
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Pokemon <span className="text-violet-400">Stock Watcher</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Track Smyths Pokemon card availability, get alerted instantly, and open the product page when stock appears.
          </p>
        </div>

        <div className="relative flex min-h-[220px] items-center justify-center">
          <div className="absolute h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute h-28 w-28 rounded-full border border-violet-300/20 bg-violet-400/15 blur-2xl" />
          <div className="relative flex items-center gap-6">
            <div className="h-40 w-28 rotate-[-14deg] rounded-[28px] border border-white/10 bg-gradient-to-b from-violet-500/30 via-indigo-500/20 to-slate-900 p-3 shadow-glow-violet">
              <div className="h-full rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                <div className="mx-auto mt-6 h-20 w-16 rounded-2xl bg-gradient-to-br from-fuchsia-400/50 to-indigo-500/30" />
                <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/20" />
                <div className="mx-auto mt-2 h-1.5 w-9 rounded-full bg-white/10" />
              </div>
            </div>
            <div className="h-32 w-24 rotate-[10deg] rounded-[24px] border border-white/10 bg-gradient-to-b from-slate-800 to-slate-950 p-3">
              <div className="h-full rounded-[18px] border border-dashed border-violet-300/20 bg-gradient-to-br from-violet-500/10 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
