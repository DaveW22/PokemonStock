const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const blockedSignals = [
  'Incapsula incident',
  '_Incapsula_Resource',
  'Request unsuccessful. Incapsula incident ID',
  'Attention Required! | Cloudflare',
  'cf-chl-bypass',
  'captcha',
]

type VerifyResult = {
  ok: boolean
  isProduct: boolean
  confidence: number
  url: string
  retailer: string
  title: string | null
  price: string | null
  image: string | null
  reason: string
  signals: string[]
}

function extractMeta(content: string, propertyName: string) {
  const propertyPattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  )

  const contentFirstPattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${propertyName}["'][^>]*>`,
    'i',
  )

  return content.match(propertyPattern)?.[1]?.trim() ?? content.match(contentFirstPattern)?.[1]?.trim() ?? null
}

function extractTitle(html: string) {
  const ogTitle = extractMeta(html, 'og:title')
  if (ogTitle) return ogTitle

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return titleMatch?.[1]?.trim() ?? null
}

function extractPrice(html: string) {
  const ogPrice =
    extractMeta(html, 'product:price:amount') ??
    extractMeta(html, 'og:price:amount') ??
    extractMeta(html, 'twitter:data1')

  if (ogPrice) return ogPrice

  const itemPropPrice = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)?.[1]
  if (itemPropPrice) return itemPropPrice.trim()

  const textPriceMatch = html.match(/(?:£|\$|€)\s?\d{1,4}(?:[.,]\d{2})?/)
  return textPriceMatch?.[0] ?? null
}

function extractImage(html: string) {
  return (
    extractMeta(html, 'og:image') ??
    extractMeta(html, 'twitter:image') ??
    extractMeta(html, 'twitter:image:src')
  )
}

function extractRetailer(url: URL) {
  return url.hostname.replace(/^www\./, '')
}

function looksLikeProductUrl(url: URL) {
  return /\/p\/\d+$/.test(url.pathname)
}

function fallbackTitleFromUrl(url: URL) {
  const path = url.pathname.replace(/\/$/, '')
  const nameMatch = path.match(/\/([^/]+)\/p\/\d+$/)
  if (!nameMatch) return null

  return nameMatch[1]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function calculateSignals(html: string, title: string | null) {
  const lower = html.toLowerCase()
  const signals: string[] = []

  const signalChecks = [
    { id: 'meta-og-type-product', pass: /<meta[^>]+(?:property|name)=["']og:type["'][^>]+content=["']product["']/i.test(html) },
    { id: 'schema-product', pass: /"@type"\s*:\s*"product"/i.test(html) || /schema\.org\/Product/i.test(html) },
    { id: 'product-price', pass: Boolean(extractPrice(html)) },
    { id: 'add-to-cart-cta', pass: /(add to basket|add to cart|buy now|click & collect|in stock)/i.test(lower) },
    { id: 'title-present', pass: Boolean(title) },
  ]

  signalChecks.forEach((check) => {
    if (check.pass) signals.push(check.id)
  })

  return signals
}

function confidenceFromSignals(signals: string[]) {
  const weightMap: Record<string, number> = {
    'meta-og-type-product': 0.3,
    'schema-product': 0.3,
    'product-price': 0.2,
    'add-to-cart-cta': 0.15,
    'title-present': 0.05,
  }

  return Math.min(1, signals.reduce((sum, signal) => sum + (weightMap[signal] ?? 0), 0))
}

async function verifyUrl(inputUrl: string): Promise<VerifyResult> {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(inputUrl)
  } catch {
    return {
      ok: false,
      isProduct: false,
      confidence: 0,
      url: inputUrl,
      retailer: '',
      title: null,
      price: null,
      image: null,
      reason: 'Invalid URL format. Include full URL starting with https://',
      signals: [],
    }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      ok: false,
      isProduct: false,
      confidence: 0,
      url: inputUrl,
      retailer: extractRetailer(parsedUrl),
      title: null,
      price: null,
      image: null,
      reason: 'Only HTTP/HTTPS URLs are supported.',
      signals: [],
    }
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'PokemonStockWatcher/1.0 (soft-url-check)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      return {
        ok: false,
        isProduct: false,
        confidence: 0,
        url: parsedUrl.toString(),
        retailer: extractRetailer(parsedUrl),
        title: null,
        price: null,
        image: null,
        reason: `Could not load page (HTTP ${response.status}).`,
        signals: [],
      }
    }

    const html = await response.text()
    const blockedMatch = blockedSignals.find((signal) =>
      html.toLowerCase().includes(signal.toLowerCase()),
    )

    if (blockedMatch) {
      const inferredProduct = looksLikeProductUrl(parsedUrl)

      return {
        ok: true,
        isProduct: inferredProduct,
        confidence: inferredProduct ? 0.55 : 0.2,
        url: parsedUrl.toString(),
        retailer: extractRetailer(parsedUrl),
        title: fallbackTitleFromUrl(parsedUrl),
        price: null,
        image: null,
        reason: inferredProduct
          ? 'Retailer bot protection blocked content; inferred product page from URL pattern.'
          : 'Retailer bot protection blocked content and URL pattern is inconclusive.',
        signals: [blockedMatch, inferredProduct ? 'url-pattern-product' : 'url-pattern-unknown'],
      }
    }

    const title = extractTitle(html)
    const price = extractPrice(html)
    const image = extractImage(html)
    const signals = calculateSignals(html, title)
    const confidence = confidenceFromSignals(signals)
    const inferredProduct = looksLikeProductUrl(parsedUrl)
    const isProduct = confidence >= 0.45 || inferredProduct

    return {
      ok: true,
      isProduct,
      confidence: isProduct && confidence < 0.45 ? 0.5 : confidence,
      url: parsedUrl.toString(),
      retailer: extractRetailer(parsedUrl),
      title: title || fallbackTitleFromUrl(parsedUrl),
      price,
      image,
      reason: isProduct
        ? 'Soft URL check passed.'
        : 'Soft URL check could not confidently confirm this is a product page.',
      signals: inferredProduct ? [...signals, 'url-pattern-product'] : signals,
    }
  } catch (error) {
    return {
      ok: false,
      isProduct: false,
      confidence: 0,
      url: parsedUrl.toString(),
      retailer: extractRetailer(parsedUrl),
      title: null,
      price: null,
      image: null,
      reason: error instanceof Error ? error.message : 'Unexpected URL check error.',
      signals: [],
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await request.json()
    const inputUrl = typeof payload?.url === 'string' ? payload.url.trim() : ''

    if (!inputUrl) {
      return new Response(JSON.stringify({ error: 'Missing "url" in request body.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await verifyUrl(inputUrl)

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected error during URL verification.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
