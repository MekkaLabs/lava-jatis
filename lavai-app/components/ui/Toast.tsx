'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

const typeConfig: Record<ToastType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle,    color: '#00e676', bg: 'rgba(0,230,118,0.08)',  border: 'rgba(0,230,118,0.2)' },
  error:   { icon: AlertCircle,    color: '#ff1744', bg: 'rgba(255,23,68,0.08)',  border: 'rgba(255,23,68,0.2)' },
  warning: { icon: AlertTriangle,  color: '#ffd600', bg: 'rgba(255,214,0,0.08)', border: 'rgba(255,214,0,0.2)' },
  info:    { icon: Info,           color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
}

function ToastComponent({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { icon: Icon, color, bg, border } = typeConfig[item.type]
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(item.id), 300)
    }, 4000)
    return () => clearTimeout(t)
  }, [item.id, onDismiss])

  return (
    <div
      style={{
        background: bg,
        border: '1px solid ' + border,
        borderLeft: '3px solid ' + color,
        backdropFilter: 'blur(12px)',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        minWidth: '280px',
        maxWidth: '360px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <Icon size={16} style={{ color, flexShrink: 0 }} />
      <p style={{ color: '#fff', fontSize: '0.8125rem', fontWeight: 500, flex: 1 }}>{item.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(item.id), 300) }}
        style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '2px' }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-2), { id, type, message }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
        {toasts.map(t => (
          <ToastComponent key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

// Standalone hook pattern — also export ToastContainer for use without provider
export function useToastStandalone() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-2), { id, type, message }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
      {toasts.map(t => (
        <ToastComponent key={t.id} item={t} onDismiss={dismiss} />
      ))}
    </div>
  )

  return { toast, ToastContainer }
}
