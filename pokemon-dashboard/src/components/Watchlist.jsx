import { LayoutDashboard, ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'
import ProductRow from './ProductRow'

const priorityWeight = {
  High: 0,
  Medium: 1,
  Low: 2,
}

const statusWeight = {
  potential: 0,
  checking: 1,
  unknown: 2,
  out: 3,
}

export default function Watchlist({ products, onOpen, onToggleFavourite }) {
  const [sortMode, setSortMode] = useState('priority')
  const [viewMode, setViewMode] = useState('list')

  const sortedProducts = useMemo(() => {
    return [...products].sort((left, right) => {
      if (sortMode === 'name') {
        return left.name.localeCompare(right.name)
      }

      if (sortMode === 'status') {
        const leftStatus = statusWeight[left.status] ?? 99
        const rightStatus = statusWeight[right.status] ?? 99
        if (leftStatus !== rightStatus) return leftStatus - rightStatus
        return left.name.localeCompare(right.name)
      }

      if (sortMode === 'recent') {
        const leftTime = left.lastCheckedAt ? new Date(left.lastCheckedAt).getTime() : 0
        const rightTime = right.lastCheckedAt ? new Date(right.lastCheckedAt).getTime() : 0
        return rightTime - leftTime
      }

      const leftPriority = priorityWeight[left.priority] ?? 99
      const rightPriority = priorityWeight[right.priority] ?? 99
      if (leftPriority !== rightPriority) return leftPriority - rightPriority
      return left.name.localeCompare(right.name)
    })
  }, [products, sortMode])

  return (
    <section className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-3 shadow-2xl shadow-black/20 md:mt-8 md:rounded-[32px] md:p-5">
      <div className="flex flex-col gap-3 border-b border-white/8 pb-4 md:gap-4 md:pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white md:text-2xl">Watchlist</h2>
          <span className="rounded-full border border-violet-400/15 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-200">
            {products.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 md:gap-3 md:text-sm">
          <button
            type="button"
            onClick={() =>
              setSortMode((current) => {
                if (current === 'priority') return 'recent'
                if (current === 'recent') return 'name'
                if (current === 'name') return 'status'
                return 'priority'
              })
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 hover:border-violet-400/20 hover:text-white"
          >
            <ListFilter className="h-4 w-4" />
            Sort by: {sortMode === 'priority' ? 'Priority' : sortMode === 'recent' ? 'Recent check' : sortMode === 'name' ? 'Name' : 'Status'}
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={[
                'rounded-xl px-3 py-2',
                viewMode === 'list' ? 'bg-violet-500/15 text-violet-100' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={[
                'inline-flex items-center gap-2 rounded-xl px-3 py-2',
                viewMode === 'compact' ? 'bg-violet-500/15 text-violet-100' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Compact
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 md:mt-5 md:space-y-4">
        {sortedProducts.map((product, index) => (
          <ProductRow
            key={product.id}
            product={product}
            index={index}
            viewMode={viewMode}
            onOpen={onOpen}
            onToggleFavourite={onToggleFavourite}
          />
        ))}
      </div>
    </section>
  )
}
