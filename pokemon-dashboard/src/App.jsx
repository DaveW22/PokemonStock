import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, PackageSearch } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import RightPanel from './components/RightPanel'
import StatCard from './components/StatCard'
import Watchlist from './components/Watchlist'
import { products as initialProducts } from './data/products'

export default function App() {
  const [products, setProducts] = useState(initialProducts)
  const [checkInterval, setCheckInterval] = useState('Every 3 minutes')
  const [lastCheck, setLastCheck] = useState('09:42:15')
  const [nextCheck, setNextCheck] = useState('09:45:00')

  function runManualCheck() {
    console.log('[Pokemon Stock Watcher] runManualCheck() placeholder invoked')
    setLastCheck(new Date().toLocaleTimeString('en-GB', { hour12: false }))
  }

  function openProductPage(product) {
    console.log('[Pokemon Stock Watcher] openProductPage()', product)
    if (product?.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer')
    }
  }

  function toggleFavourite(product) {
    console.log('[Pokemon Stock Watcher] toggleFavourite()', product)
    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, favourite: !item.favourite } : item,
      ),
    )
  }

  function updateCheckInterval(value) {
    console.log('[Pokemon Stock Watcher] updateCheckInterval()', value)
    setCheckInterval(value)
  }

  const summary = useMemo(() => {
    const high = products.filter((product) => product.priority === 'High').length
    const medium = products.filter((product) => product.priority === 'Medium').length
    const low = products.filter((product) => product.priority === 'Low').length

    return {
      total: products.length,
      high,
      medium,
      low,
      available: products.filter((product) => product.status === 'potential').length,
    }
  }, [products])

  return (
    <div className="min-h-screen bg-transparent p-4 text-white lg:p-6">
      <div className="dashboard-shell mx-auto max-w-[1800px] rounded-[36px] border border-white/8 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] lg:p-6">
        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_330px]">
          <Sidebar lastCheck={lastCheck} nextCheck={nextCheck} />

          <main className="min-w-0">
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_260px_260px]">
              <div className="2xl:col-span-1">
                <Hero />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-1">
                <StatCard
                  title="Available now"
                  value={summary.available}
                  subtext="item"
                  linkText="See watchlist"
                  tone="emerald"
                />
                <StatCard
                  title="Check cycle"
                  value="3m"
                  subtext="minutes"
                  meta={`Next: ${nextCheck}`}
                />
              </div>
            </div>

            <Watchlist
              products={products}
              onOpen={openProductPage}
              onToggleFavourite={toggleFavourite}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="mt-6 flex flex-col gap-3 rounded-[24px] border border-emerald-400/15 bg-emerald-500/8 px-5 py-4 shadow-glow-emerald sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/12 text-emerald-300">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Watching for stock</p>
                  <p className="text-sm text-emerald-200/80">Running continuously</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-200/80">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <PackageSearch className="h-4 w-4" />
                <span>Local dashboard mode active</span>
              </div>
            </motion.div>
          </main>

          <aside>
            <RightPanel
              checkInterval={checkInterval}
              onRunManualCheck={runManualCheck}
              onUpdateCheckInterval={updateCheckInterval}
              summary={summary}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
