import { Bell, CheckCircle2, Clock, RefreshCw, Settings, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

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

function ToggleRow({ label, value, accent = 'default', disabled = false, note, onClick, loading = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick || loading}
      className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left"
    >
      <div className="min-w-0 pr-3">
        <p className="truncate text-sm font-medium text-white">{label}</p>
        {note ? <p className="mt-1 break-words text-xs text-slate-400">{note}</p> : null}
        {disabled ? <p className="mt-1 break-words text-xs text-slate-500">Disabled / not recommended</p> : null}
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
    </button>
  )
}

export default function RightPanel({
  checkInterval,
  onRunManualCheck,
  onUpdateCheckInterval,
  onAddProduct,
  addingProduct,
  addProductMessage,
  summary,
  statusNote,
  webPushSupported,
  webPushEnabled,
  webPushBusy,
  webPushMessage,
  onToggleWebPush,
}) {
  const [newProduct, setNewProduct] = useState({
    name: '',
    retailer: '',
    url: '',
    price: '',
    priority: 'Medium',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await onAddProduct(newProduct)

    if (!result?.error) {
      setNewProduct((current) => ({
        ...current,
        name: '',
        retailer: '',
        url: '',
        price: '',
      }))
    }
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <PanelCard icon={Bell} title="Alert & Notification">
        <div className="space-y-3">
          <ToggleRow
            label="Safari web push alerts"
            value={webPushEnabled}
            accent="green"
            disabled={!webPushSupported}
            note={
              webPushMessage ||
              'Enable push alerts for stock changes. On iPhone, add this site to your home screen first.'
            }
            onClick={onToggleWebPush}
            loading={webPushBusy}
          />
          <ToggleRow label="Open browser on stock" value />
          <ToggleRow label="Auto checkout" value={false} disabled />
        </div>
      </PanelCard>

      <PanelCard icon={Settings} title="Monitor Settings">
        <div className="space-y-3 md:space-y-4">
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

          <form onSubmit={handleSubmit} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Add store URL</p>
            <input
              value={newProduct.name}
              onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))}
              placeholder="Product name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={newProduct.retailer}
              onChange={(event) => setNewProduct((current) => ({ ...current, retailer: event.target.value }))}
              placeholder="Retailer (e.g. Argos)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={newProduct.url}
              onChange={(event) => setNewProduct((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://example.com/product"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newProduct.price}
                onChange={(event) => setNewProduct((current) => ({ ...current, price: event.target.value }))}
                placeholder="Price (optional)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
              />
              <select
                value={newProduct.priority}
                onChange={(event) => setNewProduct((current) => ({ ...current, priority: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={addingProduct}
              className="w-full rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100"
            >
              {addingProduct ? 'Adding...' : 'Add URL for stock checks'}
            </button>
            {addProductMessage ? <p className="break-words text-xs text-slate-300">{addProductMessage}</p> : null}
          </form>
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
            <span className="break-words">{statusNote}</span>
          </div>
        </div>
      </PanelCard>
    </div>
  )
}
