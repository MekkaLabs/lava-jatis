import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ServiceStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '')
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export function getStatusLabel(status: ServiceStatus): string {
  const labels: Record<ServiceStatus, string> = {
    waiting:     'Aguardando',
    in_progress: 'Em andamento',
    done:        'Pronto ✓',
    cancelled:   'Cancelado',
  }
  return labels[status]
}

export function getStatusColor(status: ServiceStatus): string {
  const colors: Record<ServiceStatus, string> = {
    waiting:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    in_progress: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    done:        'text-green-400 bg-green-400/10 border-green-400/20',
    cancelled:   'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return colors[status]
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-cyan-400/20 text-cyan-400',
    'bg-purple-400/20 text-purple-400',
    'bg-green-400/20 text-green-400',
    'bg-blue-400/20 text-blue-400',
    'bg-yellow-400/20 text-yellow-400',
    'bg-pink-400/20 text-pink-400',
    'bg-orange-400/20 text-orange-400',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function timeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function estimatedWait(queuePosition: number, avgDuration = 30): string {
  const totalMin = queuePosition * avgDuration
  return timeAgo(totalMin)
}
