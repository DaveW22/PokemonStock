import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react'

const config = {
  potential: {
    label: 'Potentially in stock',
    className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  out: {
    label: 'Out of stock',
    className: 'border-slate-500/25 bg-slate-500/10 text-slate-300',
    dot: 'bg-slate-400',
    icon: XCircle,
  },
  checking: {
    label: 'Checking...',
    className: 'border-sky-400/25 bg-sky-500/10 text-sky-300',
    dot: 'bg-sky-400',
    icon: RefreshCw,
  },
  unknown: {
    label: 'Unknown / error',
    className: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
    icon: AlertTriangle,
  },
}

export default function StatusPill({ status }) {
  const statusConfig = config[status] ?? config.unknown
  const Icon = statusConfig.icon

  return (
    <motion.div
      animate={status === 'checking' ? { opacity: [0.75, 1, 0.75] } : { opacity: 1 }}
      transition={status === 'checking' ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } : {}}
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
        statusConfig.className,
      ].join(' ')}
    >
      <span className={['h-2 w-2 rounded-full', statusConfig.dot].join(' ')} />
      <Icon className={status === 'checking' ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
      <span>{statusConfig.label}</span>
    </motion.div>
  )
}
