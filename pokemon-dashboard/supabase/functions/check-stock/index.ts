import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const availableSignals = [
  'Add to Basket',
  'Click & Collect',
  'Home Delivery',
  'Available',
]

const unavailableSignals = [
  'Out of Stock',
  'Currently unavailable',
  'Not available',
  'Sorry, this product is currently unavailable',
]

type Product = {
  id: string
  name: string
  retailer: string
  url: string
  price: string | null
  priority: string
}

type ExistingStatus = {
  product_id: string
  status: 'available' | 'unavailable' | 'unknown' | 'error'
  last_available_at: string | null
}

type CheckOutcome = {
  status: 'available' | 'unavailable' | 'unknown' | 'error'
  matchedSignals: string[]
  pageExcerpt: string | null
  error: string | null
}

type WebPushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

type WebPushSendError = {
  statusCode?: number
  body?: string
  message?: string
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractExcerpt(text: string, signals: string[]) {
  if (signals.length === 0) {
    return text.slice(0, 280) || null
  }

  const lowerText = text.toLowerCase()
  const signalIndex = signals
    .map((signal) => lowerText.indexOf(signal.toLowerCase()))
    .find((index) => index >= 0)

  if (signalIndex === undefined || signalIndex < 0) {
    return text.slice(0, 280) || null
  }

  const start = Math.max(0, signalIndex - 80)
  const end = Math.min(text.length, signalIndex + 200)
  return text.slice(start, end).trim()
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: false,
    }),
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Telegram send failed: ${response.status} ${responseText}`)
  }
}

function asWebPushError(error: unknown): WebPushSendError {
  if (error && typeof error === 'object') {
    return error as WebPushSendError
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown web push error',
  }
}

async function evaluateProduct(product: Product): Promise<CheckOutcome> {
  try {
    const response = await fetch(product.url, {
      headers: {
        'User-Agent': 'PokemonStockWatcher/1.0 (Supabase Edge Function; manual purchase only)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      return {
        status: 'error',
        matchedSignals: [],
        pageExcerpt: null,
        error: `HTTP ${response.status}`,
      }
    }

    const html = await response.text()
    const text = stripHtml(html)
    const matchedAvailableSignals = availableSignals.filter((signal) =>
      text.toLowerCase().includes(signal.toLowerCase()),
    )
    const matchedUnavailableSignals = unavailableSignals.filter((signal) =>
      text.toLowerCase().includes(signal.toLowerCase()),
    )
    const matchedSignals = [...matchedAvailableSignals, ...matchedUnavailableSignals]

    if (matchedAvailableSignals.length > 0 && matchedUnavailableSignals.length === 0) {
      return {
        status: 'available',
        matchedSignals,
        pageExcerpt: extractExcerpt(text, matchedSignals),
        error: null,
      }
    }

    if (matchedUnavailableSignals.length > 0) {
      return {
        status: 'unavailable',
        matchedSignals,
        pageExcerpt: extractExcerpt(text, matchedSignals),
        error: null,
      }
    }

    return {
      status: 'unknown',
      matchedSignals,
      pageExcerpt: extractExcerpt(text, matchedSignals),
      error: null,
    }
  } catch (error) {
    return {
      status: 'error',
      matchedSignals: [],
      pageExcerpt: null,
      error: error instanceof Error ? error.message : 'Unknown request error',
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const checkedAt = new Date().toISOString()
  const webPushEnabled = Boolean(vapidSubject && vapidPublicKey && vapidPrivateKey)

  if (webPushEnabled) {
    webpush.setVapidDetails(vapidSubject!, vapidPublicKey!, vapidPrivateKey!)
  }

  try {
    const [{ data: products, error: productsError }, { data: currentStatuses, error: statusesError }] =
      await Promise.all([
        supabase
          .from('products')
          .select('id, name, retailer, url, price, priority')
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('product_status')
          .select('product_id, status, last_available_at'),
      ])

    if (productsError) throw productsError
    if (statusesError) throw statusesError

    const statusMap = new Map<string, ExistingStatus>((currentStatuses ?? []).map((row) => [row.product_id, row]))
    const results = []

    for (const product of (products ?? []) as Product[]) {
      const currentStatus = statusMap.get(product.id)
      const outcome = await evaluateProduct(product)
      const previousStatus = currentStatus?.status ?? null

      const { error: stockCheckError } = await supabase.from('stock_checks').insert({
        product_id: product.id,
        status: outcome.status,
        matched_signals: outcome.matchedSignals,
        page_excerpt: outcome.pageExcerpt,
        error: outcome.error,
        checked_at: checkedAt,
      })

      if (stockCheckError) throw stockCheckError

      const { error: upsertError } = await supabase.from('product_status').upsert({
        product_id: product.id,
        status: outcome.status,
        previous_status: previousStatus,
        matched_signals: outcome.matchedSignals,
        last_checked_at: checkedAt,
        last_available_at:
          outcome.status === 'available'
            ? checkedAt
            : currentStatus?.last_available_at ?? null,
        last_error: outcome.error,
        updated_at: checkedAt,
      })

      if (upsertError) throw upsertError

      if (outcome.status === 'available' && previousStatus !== 'available') {
        const alertMessage = `${product.name} may be in stock at ${product.retailer}. Open product page manually: ${product.url}`

        const { error: alertError } = await supabase.from('alert_events').insert({
          product_id: product.id,
          alert_type: 'stock_available',
          message: alertMessage,
          sent: false,
        })

        if (alertError) throw alertError

        let sent = false
        if (telegramBotToken && telegramChatId) {
          try {
            await sendTelegramMessage(telegramBotToken, telegramChatId, alertMessage)
            sent = true
          } catch (telegramError) {
            console.error('Telegram notification failed', telegramError)
          }
        }

        if (webPushEnabled) {
          const { data: subscriptions, error: subscriptionsError } = await supabase
            .from('web_push_subscriptions')
            .select('id, endpoint, p256dh, auth')
            .eq('is_active', true)

          if (subscriptionsError) {
            console.error('Failed to load web push subscriptions', subscriptionsError)
          }

          for (const subscription of (subscriptions ?? []) as WebPushSubscriptionRow[]) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                  },
                },
                JSON.stringify({
                  title: 'Pokemon Stock Alert',
                  body: `${product.name} may be in stock at ${product.retailer}. Tap to open the product page.`,
                  url: product.url,
                  tag: `stock-${product.id}`,
                }),
              )

              sent = true

              const { error: successUpdateError } = await supabase
                .from('web_push_subscriptions')
                .update({
                  is_active: true,
                  last_success_at: checkedAt,
                  last_failure_at: null,
                  failure_reason: null,
                })
                .eq('id', subscription.id)

              if (successUpdateError) {
                console.error('Failed to update successful push delivery metadata', successUpdateError)
              }
            } catch (pushError) {
              const normalizedError = asWebPushError(pushError)
              const shouldDeactivate = normalizedError.statusCode === 404 || normalizedError.statusCode === 410

              const { error: failureUpdateError } = await supabase
                .from('web_push_subscriptions')
                .update({
                  is_active: shouldDeactivate ? false : true,
                  last_failure_at: checkedAt,
                  failure_reason:
                    normalizedError.body ??
                    normalizedError.message ??
                    `Push failed with status code ${normalizedError.statusCode ?? 'unknown'}`,
                })
                .eq('id', subscription.id)

              if (failureUpdateError) {
                console.error('Failed to update failed push delivery metadata', failureUpdateError)
              }

              console.error('Web push notification failed', normalizedError)
            }
          }
        }

        if (sent) {
          const { error: markSentError } = await supabase
            .from('alert_events')
            .update({ sent: true, sent_at: checkedAt })
            .eq('product_id', product.id)
            .eq('message', alertMessage)
            .is('sent_at', null)

          if (markSentError) throw markSentError
        }
      }

      results.push({
        productId: product.id,
        name: product.name,
        status: outcome.status,
        previousStatus,
        matchedSignals: outcome.matchedSignals,
        checkedAt,
        error: outcome.error,
      })

      await delay(5000)
    }

    return new Response(JSON.stringify({ ok: true, checkedAt, results }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('check-stock failed', error)

    return new Response(
      JSON.stringify({
        ok: false,
        checkedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
