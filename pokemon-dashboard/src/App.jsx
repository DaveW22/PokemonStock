import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Menu, PackageSearch, RefreshCw, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import RightPanel from './components/RightPanel'
import StatCard from './components/StatCard'
import Watchlist from './components/Watchlist'
import { products as initialProducts } from './data/products'
import { useProductStatuses } from './hooks/useProductStatuses'
import {
  createLocalDeviceId,
  disableWebPush,
  getWebPushReadinessMessage,
  getExistingSubscription,
  supportsWebPush,
  upsertWebPushSubscription,
} from './lib/webPush'
import { hasSupabaseConfig, supabase } from './lib/supabase'

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
    addProduct,
    addingProduct,
    addProductMessage,
    actionMessage,
  } = useProductStatuses()
  const [favourites, setFavourites] = useState({})
  const [checkInterval, setCheckInterval] = useState('Every 3 minutes')
  const [menuOpen, setMenuOpen] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const pullStartYRef = useRef(null)
  const [webPushSupported] = useState(() => supportsWebPush())
  const [webPushEnabled, setWebPushEnabled] = useState(false)
  const [webPushBusy, setWebPushBusy] = useState(false)
  const [webPushMessage, setWebPushMessage] = useState('')
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

  async function runRefresh(reason = 'manual') {
    console.log('[Pokemon Stock Watcher] runRefresh()', reason)
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

  async function handleAddProduct(payload) {
    const result = await addProduct(payload)
    if (!result.error) {
      setMenuOpen(false)
    }

    return result
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

  const statusNote = useMemo(() => {
    if (actionMessage) {
      if (actionMessage.includes('Missing Supabase environment variables')) {
        return 'Manual check unavailable until Supabase env values are configured in deployment.'
      }

      return actionMessage
    }

    if (error) {
      if (error.includes('Missing Supabase environment variables')) {
        return 'Live checks are unavailable until Supabase environment values are configured in deployment.'
      }

      return error
    }

    if (liveProducts.length > 0) {
      return 'Reading live products and latest statuses from Supabase.'
    }

    return 'Using fallback products. Connect Supabase env values to enable live checks.'
  }, [actionMessage, error, liveProducts.length])

  function handleTouchStart(event) {
    if (window.scrollY > 0 || pullRefreshing) return
    pullStartYRef.current = event.touches[0]?.clientY ?? null
  }

  function handleTouchMove(event) {
    if (pullStartYRef.current == null || pullRefreshing) return

    const currentY = event.touches[0]?.clientY ?? pullStartYRef.current
    const delta = currentY - pullStartYRef.current

    if (delta > 0) {
      setPullDistance(Math.min(delta, 110))
    }
  }

  async function handleTouchEnd() {
    if (pullDistance >= 78 && !pullRefreshing) {
      try {
        setPullRefreshing(true)
        await runRefresh('pull-to-refresh')
      } finally {
        setPullRefreshing(false)
      }
    }

    setPullDistance(0)
    pullStartYRef.current = null
  }

  useEffect(() => {
    const readinessMessage = getWebPushReadinessMessage()
    if (readinessMessage) {
      setWebPushMessage(readinessMessage)
      return
    }

    if (!webPushSupported) {
      setWebPushMessage('This browser does not support web push notifications.')
      return
    }

    getExistingSubscription().then((subscription) => {
      setWebPushEnabled(Boolean(subscription))
      if (subscription) {
        setWebPushMessage('Push alerts are enabled for this device.')
      }
    })
  }, [webPushSupported])

  async function toggleWebPush() {
    const readinessMessage = getWebPushReadinessMessage()
    if (readinessMessage) {
      setWebPushMessage(readinessMessage)
      return
    }

    if (!webPushSupported || !hasSupabaseConfig || !supabase) {
      setWebPushMessage('Push alerts require browser support and Supabase environment variables.')
      return
    }

    setWebPushBusy(true)
    setWebPushMessage('')

    try {
      const deviceId = createLocalDeviceId()

      if (webPushEnabled) {
        const disabled = await disableWebPush(supabase, deviceId)
        if (!disabled.ok) throw disabled.error

        setWebPushEnabled(false)
        setWebPushMessage('Push alerts disabled on this device.')
      } else {
        const result = await upsertWebPushSubscription(supabase, deviceId)
        if (!result.ok) throw result.error

        setWebPushEnabled(true)
        setWebPushMessage('Push alerts enabled. Add this app to your iPhone home screen for Safari web app notifications.')
      }
    } catch (pushError) {
      const message = pushError instanceof Error ? pushError.message : 'Unable to update push subscription.'
      setWebPushMessage(message)
    } finally {
      setWebPushBusy(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-transparent p-2 text-white md:p-4 lg:p-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mx-auto flex h-7 max-w-[1800px] items-center justify-center text-xs text-slate-300">
        {pullRefreshing || pullDistance > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <RefreshCw className={pullRefreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            {pullRefreshing ? 'Refreshing...' : pullDistance >= 78 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        ) : null}
      </div>
      <div className="dashboard-shell mx-auto max-w-[1800px] rounded-[28px] border border-white/8 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-4 lg:rounded-[36px] lg:p-6">
        <header className="mb-4 rounded-2xl border border-white/8 bg-white/5 p-3 xl:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-white">Pokemon Stock Watcher</p>
              <p className="text-xs text-slate-400">Last check: {lastCheck}</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
          {menuOpen ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {['Dashboard', 'Watchlist', 'History', 'Settings', 'About'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-slate-200"
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                onClick={() => runRefresh('mobile-header')}
                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-3 py-2 text-emerald-100"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh now
              </button>
            </div>
          ) : null}
        </header>

        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_330px] xl:gap-6">
          <div className="hidden xl:block">
            <Sidebar lastCheck={lastCheck} nextCheck={nextCheck} />
          </div>

          <main className="min-w-0">
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_260px_260px] 2xl:gap-5">
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
              onAddProduct={handleAddProduct}
              addingProduct={addingProduct}
              addProductMessage={addProductMessage}
              webPushSupported={webPushSupported}
              webPushEnabled={webPushEnabled}
              webPushBusy={webPushBusy}
              webPushMessage={webPushMessage}
              onToggleWebPush={toggleWebPush}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
