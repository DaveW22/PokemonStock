import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

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

export default function MonitorProductsPage({ products, onAddProduct, addingProduct, addProductMessage }) {
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
    <div className="space-y-4">
      <PanelCard icon={Search} title="Monitor Product">
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
      </PanelCard>

      <PanelCard icon={Search} title="Tracked Products">
        <div className="space-y-2">
          {products.length === 0 ? (
            <p className="text-sm text-slate-400">No products tracked yet.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="truncate text-xs text-slate-400">{product.retailer} • {product.url}</p>
              </div>
            ))
          )}
        </div>
      </PanelCard>
    </div>
  )
}
