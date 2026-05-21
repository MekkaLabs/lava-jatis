// LAVAI Service Worker — v3 (SAFE / no-cache)
// ⚠️ Versões anteriores (v1/v2) usavam cache-first para HTML/CSS/JS, o que
// servia assets antigos misturados com builds novos → "não abre / design zuado"
// no celular. Esta versão NÃO intercepta fetch (tudo vem direto da rede) e
// LIMPA todos os caches antigos. Mantém apenas push notifications.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Apaga TODOS os caches antigos (v1, v2, etc) — elimina assets quebrados
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

// SEM listener de 'fetch': o navegador busca tudo direto da rede.
// Zero risco de servir cache desatualizado. (Offline desativado por ora.)

// Push: handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'LAVAI', body: 'Nova notificação', icon: '/icon-192.png', url: '/dashboard' }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-72.png',
    data: { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Abrir', icon: '/icon-72.png' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click: open the target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})
