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
        'rounded-[28px] border bg-gradient-to-br p-5 shadow-2xl shadow-black/20 backdrop-blur',
        toneMap[tone],
      ].join(' ')}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-4xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-sm text-slate-400">{subtext}</div>
        </div>
        {meta ? <div className="text-right text-xs text-slate-400">{meta}</div> : null}
      </div>
      {linkText ? (
        <button className="mt-6 text-sm font-medium text-violet-300 transition hover:text-violet-200">
          {linkText}
        </button>
      ) : null}
    </motion.div>
  )
}
