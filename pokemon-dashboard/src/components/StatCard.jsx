import { motion } from 'framer-motion'

export default function StatCard({ title, value, subtext, linkText, meta, tone = 'violet' }) {
  const toneMap = {
    violet: 'from-violet-500/20 to-indigo-500/10 border-violet-400/20 text-violet-200',
    emerald: 'from-emerald-500/20 to-emerald-500/10 border-emerald-400/20 text-emerald-200',
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={[
        'min-w-0 overflow-hidden rounded-[28px] border bg-gradient-to-br p-5 shadow-2xl shadow-black/20 backdrop-blur',
        toneMap[tone],
      ].join(' ')}
    >
      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-4xl font-semibold text-white">{value}</div>
          <div className="truncate text-sm text-slate-400 mt-1">{subtext}</div>
        </div>
        {meta ? <div className="max-w-[60%] break-words text-right text-xs text-slate-400">{meta}</div> : null}
      </div>
      {linkText ? (
        <button className="mt-6 max-w-full truncate text-sm font-medium text-violet-300 transition hover:text-violet-200">
          {linkText}
        </button>
      ) : null}
    </motion.div>
  )
}
