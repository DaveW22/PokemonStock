import { LayoutDashboard, ListFilter } from 'lucide-react'
import ProductRow from './ProductRow'

export default function Watchlist({ products, onOpen, onToggleFavourite }) {
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
          <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 hover:border-violet-400/20 hover:text-white">
            <ListFilter className="h-4 w-4" />
            Sort by: Priority
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
            <button className="rounded-xl bg-violet-500/15 px-3 py-2 text-violet-100">List</button>
            <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-slate-400 hover:text-slate-200">
              <LayoutDashboard className="h-4 w-4" />
              Compact
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 md:mt-5 md:space-y-4">
        {products.map((product, index) => (
          <ProductRow
            key={product.id}
            product={product}
            index={index}
            onOpen={onOpen}
            onToggleFavourite={onToggleFavourite}
          />
        ))}
      </div>
    </section>
  )
}
