import { Bell, Heart, LayoutDashboard, Search, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'monitor-products', label: 'Monitor Product', icon: Search },
  { id: 'alerts', label: 'Alert Center', icon: Bell },
]

export default function Sidebar({ lastCheck, nextCheck, currentPage, onNavigate }) {
  return (
    <aside className="flex h-full flex-col justify-between rounded-[32px] border border-white/8 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:min-h-[calc(100vh-3rem)]">
      <div>
        <div className="flex items-center gap-4 rounded-[24px] border border-white/8 bg-gradient-to-br from-violet-500/18 via-indigo-500/10 to-transparent p-4">
          <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-rose-400 via-white to-violet-400 p-[2px] shadow-glow-violet">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-navy-900">
              <div className="relative h-7 w-7 rounded-full border border-white/40 bg-white/90">
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-navy-900/70" />
                <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy-900/70 bg-white" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold tracking-wide text-white">Pokemon</p>
            <p className="text-sm text-slate-400">Stock Watcher</p>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.id === currentPage

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={[
                  'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  active
                    ? 'bg-violet-500/18 text-white shadow-glow-violet'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-[24px] border border-emerald-400/15 bg-gradient-to-br from-emerald-500/12 to-transparent p-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
            <span>Monitoring active</span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-400">
            <p>Last check: {lastCheck}</p>
            <p>Next check: {nextCheck}</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          {[Github, Heart, Settings].map((Icon, index) => (
            <button
              key={index}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-slate-400 transition hover:-translate-y-0.5 hover:border-violet-400/25 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
