'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'cyan' | 'green' | 'yellow' | 'purple' | 'red' | 'blue' | 'ghost'
  className?: string
}

const variants = {
  cyan:   'bg-cyan-400/10   text-cyan-400   border-cyan-400/20',
  green:  'bg-green-400/10  text-green-400  border-green-400/20',
  yellow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  purple: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  red:    'bg-red-400/10    text-red-400    border-red-400/20',
  blue:   'bg-blue-400/10   text-blue-400   border-blue-400/20',
  ghost:  'bg-white/5       text-gray-400   border-white/10',
}

export function Badge({ children, variant = 'ghost', className }: BadgeProps) {
  return (
    <span className={cn(
      'status-badge',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
