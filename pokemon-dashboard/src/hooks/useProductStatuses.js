import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

const priorityOrder = {
  High: 0,
  Medium: 1,
  Low: 2,
}

function formatLastChecked(value) {
  if (!value) return 'Not yet'

  return new Date(value).toLocaleTimeString('en-GB', {
    hour12: false,
  })
}

function extractUrlSuffix(url) {
  try {
    const pathname = new URL(url).pathname
    const trailingId = pathname.match(/\/p\/(\d+)$/)
    return trailingId ? `/${trailingId[1]}` : pathname
  } catch {
    return url
  }
}

function mapStatus(status) {
  switch (status) {
    case 'available':
      return 'potential'
    case 'unavailable':
      return 'out'
    case 'error':
      return 'unknown'
    case 'unknown':
    default:
      return 'unknown'
  }
}

function normalizeProducts(products, statusRows) {
  const statusByProductId = new Map(statusRows.map((row) => [row.product_id, row]))

  return [...products]
    .sort((left, right) => {
      const leftOrder = priorityOrder[left.priority] ?? 99
      const rightOrder = priorityOrder[right.priority] ?? 99

      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.name.localeCompare(right.name)
    })
    .map((product, index) => {
      const latestStatus = statusByProductId.get(product.id)

      return {
        id: product.id,
        rank: index + 1,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url ?? null,
        retailer: product.retailer,
        priority: product.priority,
        url: product.url,
        urlSuffix: extractUrlSuffix(product.url),
        lastChecked: formatLastChecked(latestStatus?.last_checked_at),
        lastCheckedAt: latestStatus?.last_checked_at ?? null,
        status: mapStatus(latestStatus?.status),
        rawStatus: latestStatus?.status ?? 'unknown',
        favourite: false,
      }
    })
}

export function useProductStatuses() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [addingProduct, setAddingProduct] = useState(false)
  const [addProductMessage, setAddProductMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setError(null)
      setLoading(false)
      return []
    }

    setLoading(true)
    setError(null)

    const [{ data: productRows, error: productError }, { data: statusRows, error: statusError }] =
      await Promise.all([
        supabase
          .from('products')
          .select('id, name, retailer, url, price, image_url, priority, is_active')
          .eq('is_active', true),
        supabase.from('product_status').select('product_id, status, last_checked_at'),
      ])

    if (productError || statusError) {
      const message = productError?.message ?? statusError?.message ?? 'Failed to load product statuses.'
      setError(message)
      setLoading(false)
      return []
    }

    const normalized = normalizeProducts(productRows ?? [], statusRows ?? [])
    setProducts(normalized)
    setLoading(false)
    return normalized
  }, [])

  const runManualCheck = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      const missingConfigError = 'Missing Supabase environment variables. Cannot invoke check-stock.'
      setActionMessage(missingConfigError)
      return { data: null, error: new Error(missingConfigError) }
    }

    setActionMessage('')

    const { data, error: invokeError } = await supabase.functions.invoke('check-stock', {
      body: {},
    })

    if (invokeError) {
      setActionMessage(invokeError.message)
      return { data: null, error: invokeError }
    }

    await refresh()
    return { data, error: null }
  }, [refresh])

  const verifyProductUrl = useCallback(async (inputUrl) => {
    if (!hasSupabaseConfig || !supabase) {
      return { data: null, error: new Error('Missing Supabase environment variables. Cannot verify URL.') }
    }

    const { data, error: verifyError } = await supabase.functions.invoke('verify-product-url', {
      body: { url: inputUrl },
    })

    if (verifyError) {
      return { data: null, error: verifyError }
    }

    if (!data?.ok || !data?.isProduct) {
      const reason = data?.reason || 'Soft URL check failed. URL does not look like a product page.'
      return { data, error: new Error(reason) }
    }

    return { data, error: null }
  }, [])

  const addProduct = useCallback(
    async ({ name, retailer, url, price, priority }) => {
      if (!hasSupabaseConfig || !supabase) {
        const missingConfigError = 'Missing Supabase environment variables. Cannot add product URL.'
        setAddProductMessage(missingConfigError)
        return { data: null, error: new Error(missingConfigError) }
      }

      try {
        const normalizedName = (name || '').trim()
        const normalizedRetailer = (retailer || '').trim()
        const normalizedUrl = (url || '').trim()
        const normalizedPrice = (price || '').trim()
        const normalizedPriority = (priority || 'Medium').trim()

        if (!normalizedUrl) {
          const validationError = new Error('URL is required.')
          setAddProductMessage(validationError.message)
          return { data: null, error: validationError }
        }

        try {
          new URL(normalizedUrl)
        } catch {
          const invalidUrlError = new Error('Please enter a valid product URL, including https://')
          setAddProductMessage(invalidUrlError.message)
          return { data: null, error: invalidUrlError }
        }

        setAddingProduct(true)
        setAddProductMessage('')

        const { data: verifiedData, error: verifyError } = await verifyProductUrl(normalizedUrl)
        if (verifyError) {
          setAddProductMessage(verifyError.message)
          return { data: null, error: verifyError }
        }

        const derivedName = normalizedName || verifiedData?.title || 'New Product'
        const derivedRetailer = normalizedRetailer || verifiedData?.retailer || 'Unknown retailer'
        const derivedPrice = normalizedPrice || verifiedData?.price || null
        const derivedImageUrl = verifiedData?.image || null

        const { data, error: insertError } = await supabase
          .from('products')
          .insert({
            name: derivedName,
            retailer: derivedRetailer,
            url: verifiedData?.url || normalizedUrl,
            price: derivedPrice,
            image_url: derivedImageUrl,
            priority: ['High', 'Medium', 'Low'].includes(normalizedPriority) ? normalizedPriority : 'Medium',
            is_active: true,
          })
          .select('id, name, retailer, url')
          .single()

        if (insertError) {
          setAddProductMessage(insertError.message)
          return { data: null, error: insertError }
        }

        setAddProductMessage('Product URL added after soft verification and info autofill.')
        await refresh()
        return { data, error: null }
      } finally {
        setAddingProduct(false)
      }
    },
    [refresh, verifyProductUrl],
  )

  const updateProductLink = useCallback(
    async ({ productId, url }) => {
      if (!hasSupabaseConfig || !supabase) {
        const missingConfigError = new Error('Missing Supabase environment variables. Cannot update product URL.')
        setActionMessage(missingConfigError.message)
        return { data: null, error: missingConfigError }
      }

      const normalizedUrl = (url || '').trim()
      if (!normalizedUrl) {
        const validationError = new Error('URL is required.')
        setActionMessage(validationError.message)
        return { data: null, error: validationError }
      }

      const { data: verifiedData, error: verifyError } = await verifyProductUrl(normalizedUrl)
      if (verifyError) {
        setActionMessage(verifyError.message)
        return { data: null, error: verifyError }
      }

      const { data, error: updateError } = await supabase
        .from('products')
        .update({
          url: verifiedData?.url || normalizedUrl,
          price: verifiedData?.price || undefined,
          image_url: verifiedData?.image || undefined,
        })
        .eq('id', productId)
        .select('id, name, retailer, url')
        .single()

      if (updateError) {
        setActionMessage(updateError.message)
        return { data: null, error: updateError }
      }

      setActionMessage('Product link updated successfully.')
      await refresh()
      return { data, error: null }
    },
    [refresh, verifyProductUrl],
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined

    const channel = supabase
      .channel('product-status-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_status',
        },
        () => {
          refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return useMemo(
    () => ({
      products,
      loading,
      error,
      refresh,
      runManualCheck,
      addProduct,
      updateProductLink,
      addingProduct,
      addProductMessage,
      actionMessage,
    }),
    [
      actionMessage,
      addProduct,
      addProductMessage,
      addingProduct,
      error,
      loading,
      products,
      refresh,
      runManualCheck,
      updateProductLink,
    ],
  )
}
