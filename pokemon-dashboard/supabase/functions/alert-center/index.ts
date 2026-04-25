import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type WebPushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

type AlertEventRow = {
  id: string
  product_id: string
  message: string
  sent: boolean
  sent_at: string | null
  created_at: string
}

type ProductRow = {
  id: string
  name: string
}

function asWebPushError(error: unknown) {
  if (error && typeof error === 'object') {
    return error as { statusCode?: number; body?: string; message?: string }
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown web push error',
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const vapidSubject = Deno.env.get('VAPID_SUBJECT')
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const webPushConfigured = Boolean(vapidSubject && vapidPublicKey && vapidPrivateKey)

  const payload = await request.json().catch(() => ({}))
  const action = payload?.action === 'test' ? 'test' : 'status'

  try {
    const [{ data: subscriptions, error: subscriptionsError }, { data: events, error: eventsError }] =
      await Promise.all([
        supabase
          .from('web_push_subscriptions')
          .select('id, endpoint, p256dh, auth')
          .eq('is_active', true),
        supabase
          .from('alert_events')
          .select('id, product_id, message, sent, sent_at, created_at')
          .order('created_at', { ascending: false })
          .limit(12),
      ])

    if (subscriptionsError) throw subscriptionsError
    if (eventsError) throw eventsError

    const eventRows = (events ?? []) as AlertEventRow[]
    const productIds = [...new Set(eventRows.map((row) => row.product_id))]

    let productsById = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds)

      if (productsError) throw productsError
      productsById = new Map((products ?? []).map((row: ProductRow) => [row.id, row.name]))
    }

    const activeSubscriptions = (subscriptions ?? []) as WebPushSubscriptionRow[]
    const statusPayload = {
      ok: true,
      webPushConfigured,
      activeSubscriptions: activeSubscriptions.length,
      recentAlerts: eventRows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: productsById.get(row.product_id) ?? 'Unknown product',
        message: row.message,
        sent: row.sent,
        sentAt: row.sent_at,
        createdAt: row.created_at,
      })),
    }

    if (action !== 'test') {
      return new Response(JSON.stringify(statusPayload), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!webPushConfigured) {
      return new Response(
        JSON.stringify({
          ...statusPayload,
          testResult: {
            ok: false,
            sentCount: 0,
            failedCount: 0,
            message: 'Web push is not configured on the server (missing VAPID keys).',
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    webpush.setVapidDetails(vapidSubject!, vapidPublicKey!, vapidPrivateKey!)

    let sentCount = 0
    let failedCount = 0

    for (const subscription of activeSubscriptions) {
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
            title: 'Pokemon Stock Watcher test alert',
            body: 'Push notifications are working. You will receive stock alerts here.',
            tag: 'pokemon-stock-test-alert',
            url: payload?.url || 'https://davids-website.eu',
          }),
        )

        sentCount += 1

        const { error: successUpdateError } = await supabase
          .from('web_push_subscriptions')
          .update({
            is_active: true,
            last_success_at: new Date().toISOString(),
            last_failure_at: null,
            failure_reason: null,
          })
          .eq('id', subscription.id)

        if (successUpdateError) {
          console.error('Failed to update successful test push metadata', successUpdateError)
        }
      } catch (pushError) {
        failedCount += 1

        const normalizedError = asWebPushError(pushError)
        const shouldDeactivate = normalizedError.statusCode === 404 || normalizedError.statusCode === 410

        const { error: failureUpdateError } = await supabase
          .from('web_push_subscriptions')
          .update({
            is_active: shouldDeactivate ? false : true,
            last_failure_at: new Date().toISOString(),
            failure_reason: normalizedError.body ?? normalizedError.message ?? 'Unknown push failure',
          })
          .eq('id', subscription.id)

        if (failureUpdateError) {
          console.error('Failed to update failed test push metadata', failureUpdateError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        ...statusPayload,
        testResult: {
          ok: sentCount > 0,
          sentCount,
          failedCount,
          message:
            activeSubscriptions.length === 0
              ? 'No active push subscriptions found. Enable Safari web push on at least one device.'
              : `Test alert send completed. Sent: ${sentCount}, Failed: ${failedCount}.`,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected alert-center error.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
