import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

function PanelCard({ icon: Icon, title, children }) {
  return (
    <motion.section
      whileHover={{ y: -2 }}
      className="min-w-0 overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.04] p-5 shadow-xl shadow-black/25"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-violet-200">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.section>
  )
}

export default function RightPanel({
  summary,
  statusNote,
}) {
  return (
    <div className="space-y-4 md:space-y-5">
      <PanelCard icon={ShieldCheck} title="Compliance First">
        <p className="text-sm leading-7 text-slate-300">
          This tool only checks stock availability and opens the product page. All purchases are manual. We do not bypass captchas or automate checkout.
        </p>
      </PanelCard>

      <PanelCard icon={CheckCircle2} title="Summary">
        <div className="grid gap-3 text-sm text-slate-300">
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Total items</span>
            <strong className="text-white">{summary.total}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Priority High</span>
            <strong className="text-white">{summary.high}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Priority Medium</span>
            <strong className="text-white">{summary.medium}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span>Priority Low</span>
            <strong className="text-white">{summary.low}</strong>
          </div>
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span className="break-words">{statusNote}</span>
          </div>
        </div>
      </PanelCard>
    </div>
  )
}
