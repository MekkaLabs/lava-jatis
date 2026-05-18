'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported' | 'loading'

export default function PushNotificationManager() {
  const [permissionState, setPermissionState] = useState<PermissionState>('loading')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isWorking, setIsWorking] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermissionState('unsupported')
      return
    }

    const current = Notification.permission as PermissionState
    setPermissionState(current)

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function subscribe() {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      showToast('Configuração de notificações indisponível.', 'error')
      return
    }

    setIsWorking(true)
    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission as PermissionState)

      if (permission !== 'granted') {
        showToast('Permissão de notificações negada.', 'error')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ).buffer as ArrayBuffer,
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })

      if (!res.ok) {
        throw new Error('Falha ao salvar inscrição no servidor')
      }

      setIsSubscribed(true)
      showToast('Notificações ativadas com sucesso!', 'success')
    } catch (err) {
      console.error('[push] subscribe error:', err)
      showToast('Erro ao ativar notificações. Tente novamente.', 'error')
    } finally {
      setIsWorking(false)
    }
  }

  async function unsubscribe() {
    setIsWorking(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      showToast('Notificações desativadas.', 'success')
    } catch (err) {
      console.error('[push] unsubscribe error:', err)
      showToast('Erro ao desativar notificações.', 'error')
    } finally {
      setIsWorking(false)
    }
  }

  if (permissionState === 'loading' || permissionState === 'unsupported') {
    return null
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: toast.type === 'success' ? 'rgba(0,230,118,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? '#00e676' : '#ef4444'}`,
            color: toast.type === 'success' ? '#00e676' : '#ef4444',
            fontSize: '14px',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxWidth: '320px',
          }}
        >
          {toast.message}
        </div>
      )}

      {permissionState === 'denied' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            fontSize: '13px',
          }}
        >
          <BellOff size={16} />
          <span>Notificações bloqueadas pelo navegador</span>
        </div>
      ) : isSubscribed ? (
        <button
          onClick={unsubscribe}
          disabled={isWorking}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0,230,118,0.1)',
            border: '1px solid rgba(0,230,118,0.3)',
            color: '#00e676',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isWorking ? 'not-allowed' : 'pointer',
            opacity: isWorking ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          <BellRing size={16} />
          {isWorking ? 'Aguarde...' : 'Notificações ativas'}
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={isWorking}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d4ff, #00b8d9)',
            border: 'none',
            color: '#08090f',
            fontSize: '14px',
            fontWeight: 700,
            cursor: isWorking ? 'not-allowed' : 'pointer',
            opacity: isWorking ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          <Bell size={16} />
          {isWorking ? 'Ativando...' : 'Ativar notificações'}
        </button>
      )}
    </>
  )
}
