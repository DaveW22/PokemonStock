import { Bell, CheckCircle2, Clock, RefreshCw, Settings, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

function PanelCard({ icon: Icon, title, children }) {
  return (
    <motion.section
      whileHover={{ y: -2 }}
      className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5 shadow-xl shadow-black/25"
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

function ToggleRow({ label, value, accent = 'default', disabled = false }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {disabled ? <p className="mt-1 text-xs text-slate-500">Disabled / not recommended</p> : null}
      </div>
      <div
        className={[
          'flex h-7 w-12 items-center rounded-full p-1 transition',
          disabled
            ? 'bg-slate-700/80'
            : value
              ? accent === 'green'
                ? 'bg-emerald-500/90'
                : 'bg-violet-500/90'
              : 'bg-slate-700/80',
        ].join(' ')}
      >
        <span
          className={[
            'h-5 w-5 rounded-full bg-white transition',
            disabled ? 'translate-x-0' : value ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </div>
    </div>
  )
}

export default function RightPanel({ checkInterval, onRunManualCheck, onUpdateCheckInterval, summary }) {
  return (
    <div className="space-y-5">
      <PanelCard icon={Bell} title="Alert & Notification">
        <div className="space-y-3">
          <ToggleRow label="Desktop notifications" value accent="green" />
          <ToggleRow label="Open browser on stock" value />
          <ToggleRow label="Auto checkout" value={false} disabled />
        </div>
      </PanelCard>

      <PanelCard icon={Settings} title="Monitor Settings">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Check interval
            </label>
            <select
              value={checkInterval}
              onChange={(event) => onUpdateCheckInterval(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/30"
            >
              <option value="Every 3 minutes">Every 3 minutes</option>
              <option value="Every 5 minutes">Every 5 minutes</option>
              <option value="Every 10 minutes">Every 10 minutes</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Retailer
            </label>
            <select className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none">
              <option>Smyths Toys</option>
            </select>
          </div>

          <button
            onClick={onRunManualCheck}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-glow-violet transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Run check now
          </button>
        </div>
      </PanelCard>

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
            Dashboard uses local mock data for this prototype.
          </div>
        </div>
      </PanelCard>
    </div>
  )
}
