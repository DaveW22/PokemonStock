import { Bell, BellRing, CheckCircle2, RefreshCw, Send } from 'lucide-react'
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

export default function AlertCenterPage({
  webPushSupported,
  webPushEnabled,
  webPushBusy,
  webPushMessage,
  onToggleWebPush,
  alertCenterBusy,
  alertCenterStatus,
  alertCenterMessage,
  onRefreshAlertCenter,
  onSendTestAlert,
}) {
  const subscriptions = alertCenterStatus?.activeSubscriptions ?? 0
  const recentAlerts = alertCenterStatus?.recentAlerts ?? []

  return (
    <div className="space-y-4">
      <PanelCard icon={Bell} title="Alert Center">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Push configured</p>
            <p className="mt-2 text-sm font-semibold text-white">{alertCenterStatus?.webPushConfigured ? 'Yes' : 'No'}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active subscriptions</p>
            <p className="mt-2 text-sm font-semibold text-white">{subscriptions}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Device alerts</p>
            <p className="mt-2 text-sm font-semibold text-white">{webPushEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={onToggleWebPush}
            disabled={!webPushSupported || webPushBusy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BellRing className={webPushBusy ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
            {webPushEnabled ? 'Disable Safari web push' : 'Enable Safari web push'}
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onRefreshAlertCenter}
              disabled={alertCenterBusy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={alertCenterBusy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh status
            </button>
            <button
              type="button"
              onClick={onSendTestAlert}
              disabled={alertCenterBusy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-glow-violet transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send test alert
            </button>
          </div>

          <p className="break-words text-xs text-slate-400">{alertCenterMessage || webPushMessage || 'No alert-center messages yet.'}</p>
        </div>
      </PanelCard>

      <PanelCard icon={CheckCircle2} title="Recent Alerts">
        <div className="space-y-2">
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-slate-400">No alerts found yet. Run stock checks or send a test alert.</p>
          ) : (
            recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{alert.productName}</p>
                  <span className={[
                    'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                    alert.sent
                      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-400/20 bg-slate-500/10 text-slate-300',
                  ].join(' ')}>
                    {alert.sent ? 'Sent' : 'Queued'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">{alert.message}</p>
                <p className="mt-1 text-[11px] text-slate-500">{new Date(alert.createdAt).toLocaleString('en-GB')}</p>
              </div>
            ))
          )}
        </div>
      </PanelCard>
    </div>
  )
}
