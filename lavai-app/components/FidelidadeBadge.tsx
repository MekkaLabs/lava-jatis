'use client'

import { NIVEL_COLORS, NIVEL_LABELS, NIVEL_EMOJIS } from '@/lib/fidelidade'

interface FidelidadeBadgeProps {
  nivel: string
  size?: 'sm' | 'md' | 'lg'
  showEmoji?: boolean
  className?: string
}

export default function FidelidadeBadge({
  nivel,
  size = 'md',
  showEmoji = true,
  className = '',
}: FidelidadeBadgeProps) {
  const color = NIVEL_COLORS[nivel] ?? NIVEL_COLORS.bronze
  const label = NIVEL_LABELS[nivel] ?? 'Bronze'
  const emoji = NIVEL_EMOJIS[nivel] ?? '🥉'

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-0.5 gap-1',
    lg: 'text-sm px-3 py-1 gap-1.5',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]} ${className}`}
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {showEmoji && <span>{emoji}</span>}
      <span>{label}</span>
    </span>
  )
}
