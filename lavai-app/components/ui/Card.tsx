'use client'

import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: 'cyan' | 'green' | 'purple' | 'none'
  hover?: boolean
}

export function Card({ children, className, glow = 'none', hover = false }: CardProps) {
  const glowStyles = {
    cyan:   'border-cyan-400/20   shadow-cyan-400/10',
    green:  'border-green-400/20  shadow-green-400/10',
    purple: 'border-purple-400/20 shadow-purple-400/10',
    none:   'border-white/7',
  }

  return (
    <div className={cn(
      'glass rounded-2xl',
      glowStyles[glow],
      hover && 'hover-lift cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}
