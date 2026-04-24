import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, PackageSearch } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import RightPanel from './components/RightPanel'
import StatCard from './components/StatCard'
import Watchlist from './components/Watchlist'
import { products as initialProducts } from './data/products'
import { useProductStatuses } from './hooks/useProductStatuses'

const intervalMinutesMap = {
  'Every 3 minutes': 3,
  'Every 5 minutes': 5,
  'Every 10 minutes': 10,
}

function formatClock(value) {
  if (!value) return 'Pending'

  return new Date(value).toLocaleTimeString('en-GB', {
    hour12: false,
  })
}

export default function App() {
  const {
    products: liveProducts,
    loading,
    error,
    refresh,
    runManualCheck: invokeManualCheck,
  } = useProductStatuses()
  const [favourites, setFavourites] = useState({})
  const [checkInterval, setCheckInterval] = useState('Every 3 minutes')
  const products = useMemo(() => {
    const sourceProducts = liveProducts.length > 0 ? liveProducts : initialProducts

    return sourceProducts.map((product) => ({
      ...product,
      favourite: favourites[product.id] ?? product.favourite ?? false,
    }))
  }, [favourites, liveProducts])

  const latestCheckedAt = useMemo(() => {
    const timestamps = products
      .map((product) => product.lastCheckedAt)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))

    if (timestamps.length === 0) return null

    return timestamps.reduce((latest, current) => (current > latest ? current : latest))
  }, [products])

  const lastCheck = latestCheckedAt ? formatClock(latestCheckedAt) : 'Not yet'
  const nextCheck = latestCheckedAt
    ? formatClock(new Date(latestCheckedAt.getTime() + intervalMinutesMap[checkInterval] * 60_000))
    : 'Pending'

  async function runManualCheck() {
    console.log('[Pokemon Stock Watcher] runManualCheck() invoked')
    await invokeManualCheck()
    await refresh()
  }

  function openProductPage(product) {
    console.log('[Pokemon Stock Watcher] openProductPage()', product)
    if (product?.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer')
    }
  }

  function toggleFavourite(product) {
    console.log('[Pokemon Stock Watcher] toggleFavourite()', product)
    setFavourites((current) => ({
      ...current,
      [product.id]: !(current[product.id] ?? product.favourite ?? false),
    }))
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

  const statusNote = error
    ? error
    : liveProducts.length > 0
      ? 'Reading live products and latest statuses from Supabase.'
      : 'Supabase is ready. Add env vars to switch from fallback data to live data.'

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
                  <Activity className={loading ? 'h-5 w-5 animate-pulse' : 'h-5 w-5'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Watching for stock</p>
                  <p className="text-sm text-emerald-200/80">
                    {loading ? 'Refreshing status from Supabase' : 'Running continuously'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-200/80">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <PackageSearch className="h-4 w-4" />
                <span>{liveProducts.length > 0 ? 'Supabase live mode active' : 'Local fallback mode active'}</span>
              </div>
            </motion.div>
          </main>

          <aside>
            <RightPanel
              checkInterval={checkInterval}
              onRunManualCheck={runManualCheck}
              onUpdateCheckInterval={updateCheckInterval}
              summary={summary}
              statusNote={statusNote}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
