const DEVICE_ID_STORAGE_KEY = 'psw_device_id'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(normalized)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

function subscriptionToPayload(subscription, deviceId) {
  const json = subscription.toJSON()

  return {
    device_id: deviceId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
    user_agent: navigator.userAgent,
    is_active: true,
  }
}

export function supportsWebPush() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isStandaloneWebApp() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function getWebPushReadinessMessage() {
  if (typeof window === 'undefined') return 'Push alerts require a browser context.'

  if (!window.isSecureContext) {
    return 'Push alerts require HTTPS.'
  }

  const isAppleMobile = /iPhone|iPad|iPod/i.test(window.navigator.userAgent)
  if (isAppleMobile && !isStandaloneWebApp()) {
    return 'On iPhone/iPad, add this site to your Home Screen and open it from the app icon to enable push alerts.'
  }

  return ''
}

export function createLocalDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing

  const created = `device-${crypto.randomUUID()}`
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, created)
  return created
}

export async function getExistingSubscription() {
  if (!supportsWebPush()) return null

  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function upsertWebPushSubscription(supabase, deviceId) {
  if (!VAPID_PUBLIC_KEY) {
    return {
      ok: false,
      error: new Error('Missing VITE_VAPID_PUBLIC_KEY. Add it to your frontend environment settings.'),
    }
  }

  if (Notification.permission === 'denied') {
    return {
      ok: false,
      error: new Error('Browser notifications are blocked. Allow notifications in Safari settings first.'),
    }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return {
        ok: false,
        error: new Error('Notification permission was not granted.'),
      }
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const payload = subscriptionToPayload(subscription, deviceId)

  if (!payload.endpoint || !payload.p256dh || !payload.auth) {
    return {
      ok: false,
      error: new Error('Push subscription payload is missing required key data.'),
    }
  }

  const { error } = await supabase.from('web_push_subscriptions').upsert(payload, {
    onConflict: 'endpoint',
  })

  if (error) {
    return { ok: false, error }
  }

  return { ok: true }
}

export async function disableWebPush(supabase, deviceId) {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    await subscription.unsubscribe()

    const { error } = await supabase
      .from('web_push_subscriptions')
      .update({ is_active: false })
      .eq('endpoint', subscription.endpoint)

    if (error) {
      return { ok: false, error }
    }

    return { ok: true }
  }

  const { error } = await supabase
    .from('web_push_subscriptions')
    .update({ is_active: false })
    .eq('device_id', deviceId)

  if (error) {
    return { ok: false, error }
  }

  return { ok: true }
}
