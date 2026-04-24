import { motion } from 'framer-motion'
import { ExternalLink, Star } from 'lucide-react'
import StatusPill from './StatusPill'

const priorityTone = {
  High: 'text-rose-300 border-rose-400/20 bg-rose-500/10',
  Medium: 'text-amber-300 border-amber-400/20 bg-amber-500/10',
  Low: 'text-slate-300 border-slate-400/20 bg-slate-500/10',
}

export default function ProductRow({ product, index, onOpen, onToggleFavourite }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.32, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="grid gap-4 rounded-[28px] border border-white/8 bg-white/[0.04] p-4 shadow-xl shadow-black/20 transition hover:border-violet-400/20 hover:bg-white/[0.055] xl:grid-cols-[56px_76px_1.4fr_140px_110px_130px_140px_140px_52px] xl:items-center"
    >
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-semibold text-white">
          {product.rank}
        </span>
      </div>

      <div className="h-16 w-16 rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.22),rgba(255,255,255,0.04))] p-2">
        <div className="flex h-full items-center justify-center rounded-[18px] bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.35),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
          <div className="h-7 w-7 rounded-full border border-violet-300/30 bg-violet-400/15" />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-white md:text-base">{product.name}</h3>
          <span className="rounded-full border border-violet-400/15 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200">
            {product.retailer}
          </span>
          <span className={[
            'rounded-full border px-2.5 py-1 text-[11px] font-medium',
            priorityTone[product.priority],
          ].join(' ')}>
            {product.priority}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-400">smythstoys.com{product.urlSuffix}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Price</p>
        <p className="mt-1 text-sm font-medium text-white">{product.price}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</p>
        <div className="mt-2">
          <StatusPill status={product.status} />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Last checked</p>
        <p className="mt-1 text-sm text-slate-300">{product.lastChecked}</p>
      </div>

      <button
        onClick={() => onOpen(product)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/12 px-4 py-3 text-sm font-medium text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-500/20"
      >
        <span>Open page</span>
        <ExternalLink className="h-4 w-4" />
      </button>

      <button
        onClick={() => onToggleFavourite(product)}
        className={[
          'flex h-12 w-12 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5',
          product.favourite
            ? 'border-amber-300/20 bg-amber-400/10 text-amber-300'
            : 'border-white/8 bg-white/5 text-slate-400 hover:text-slate-200',
        ].join(' ')}
      >
        <Star className={product.favourite ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
      </button>
    </motion.div>
  )
}
