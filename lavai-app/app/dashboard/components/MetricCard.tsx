'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color?: 'cyan' | 'green' | 'yellow' | 'red'
  loading?: boolean
  sparkline?: number[]
  tooltip?: string
}

const colorMap = {
  cyan:   { icon: 'rgba(0,212,255,0.15)', text: '#00d4ff', border: 'rgba(0,212,255,0.2)', hoverBorder: 'rgba(0,212,255,0.35)', stroke: '#00d4ff', fill: 'rgba(0,212,255,0.15)' },
  green:  { icon: 'rgba(0,230,118,0.15)', text: '#00e676', border: 'rgba(0,230,118,0.2)', hoverBorder: 'rgba(0,230,118,0.35)', stroke: '#00e676', fill: 'rgba(0,230,118,0.15)' },
  yellow: { icon: 'rgba(255,214,0,0.15)',  text: '#ffd600', border: 'rgba(255,214,0,0.2)',  hoverBorder: 'rgba(255,214,0,0.35)',  stroke: '#ffd600', fill: 'rgba(255,214,0,0.12)'  },
  red:    { icon: 'rgba(255,23,68,0.15)',  text: '#ff1744', border: 'rgba(255,23,68,0.2)',  hoverBorder: 'rgba(255,23,68,0.35)',  stroke: '#ff1744', fill: 'rgba(255,23,68,0.12)'  },
}

function Sparkline({ data, color }: { data: number[]; color: typeof colorMap[keyof typeof colorMap] }) {
  if (!data || data.length < 2) return null
  const w = 80, h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return [x, y]
  })
  const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
  const areaD = pathD + ' L' + w + ',' + h + ' L0,' + h + ' Z'

  return (
    <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={"sg-" + color.stroke.replace('#','')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color.stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={"url(#sg-" + color.stroke.replace('#','') + ")"} />
      <path d={pathD} fill="none" stroke={color.stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2.5} fill={color.stroke} />
    </svg>
  )
}

function useCountUp(target: number, duration = 800) {
  const [current, setCurrent] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    const start = performance.now()
    startRef.current = start

    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return current
}

function AnimatedNumber({ value, isCurrency }: { value: number; isCurrency: boolean }) {
  const count = useCountUp(value)
  if (isCurrency) {
    return <>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(count)}</>
  }
  return <>{count}</>
}

export default function MetricCard({ title, value, change, icon, color = 'cyan', loading, sparkline, tooltip }: MetricCardProps) {
  const c = colorMap[color]
  const [hovered, setHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  const isCurrency = typeof value === 'string' && value.includes('R$')

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 relative transition-all duration-300 cursor-default"
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        border: '1px solid ' + (hovered ? c.hoverBorder : 'rgba(26,26,46,0.8)'),
        backdropFilter: 'blur(12px)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
      }}
      onMouseEnter={() => { setHovered(true); setShowTooltip(true) }}
      onMouseLeave={() => { setHovered(false); setShowTooltip(false) }}
    >
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs text-white whitespace-nowrap z-10 pointer-events-none"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
        >
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1a1a2e' }} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">{title}</span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300"
          style={{ background: c.icon, border: '1px solid ' + c.border, transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
        >
          <span style={{ color: c.text }}>{icon}</span>
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
      ) : (
        <p className="text-3xl font-bold text-white leading-none" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
          <AnimatedNumber value={numericValue} isCurrency={isCurrency} />
        </p>
      )}

      {/* Sparkline */}
      {sparkline && !loading && (
        <div className="mt-1">
          <Sparkline data={sparkline} color={c} />
        </div>
      )}

      {/* Change indicator */}
      {change && !loading && (
        <p className={
          change.startsWith('+') ? 'text-green-400 text-xs font-medium' :
          change.startsWith('-') ? 'text-red-400 text-xs font-medium' :
          'text-gray-500 text-xs font-medium'
        }>
          {change}
        </p>
      )}
    </div>
  )
}
