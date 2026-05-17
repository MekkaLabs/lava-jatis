'use client'

import { TrendingUp, TrendingDown, Car, DollarSign, Clock, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { todayMetrics } from '@/lib/mock-data'

interface MetricCardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

function MetricCard({ label, value, delta, deltaLabel, icon, color, bgColor }: MetricCardProps) {
  const isPositive = delta !== undefined && delta >= 0

  return (
    <div className="glass rounded-2xl p-4 hover-lift">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgColor}`}>
          {icon}
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{delta}{typeof delta === 'number' && delta > 10 ? '%' : ''}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className={`text-2xl font-bold ${color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {value}
      </p>
      {deltaLabel && <p className="text-xs text-gray-500 mt-1">{deltaLabel}</p>}
    </div>
  )
}

export default function MetricsRow() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <MetricCard
        label="Carros hoje"
        value={todayMetrics.totalCars}
        delta={todayMetrics.vsYesterday.cars}
        deltaLabel="vs. ontem"
        icon={<Car size={16} className="text-cyan-400" />}
        color="text-cyan-400"
        bgColor="bg-cyan-400/10"
      />
      <MetricCard
        label="Receita hoje"
        value={formatCurrency(todayMetrics.revenue)}
        delta={todayMetrics.vsYesterday.revenue}
        deltaLabel="vs. ontem"
        icon={<DollarSign size={16} className="text-green-400" />}
        color="text-green-400"
        bgColor="bg-green-400/10"
      />
      <MetricCard
        label="Na fila agora"
        value={todayMetrics.waiting + todayMetrics.inProgress}
        deltaLabel={`${todayMetrics.inProgress} em andamento`}
        icon={<Clock size={16} className="text-blue-400" />}
        color="text-blue-400"
        bgColor="bg-blue-400/10"
      />
      <MetricCard
        label="Ticket médio"
        value={formatCurrency(todayMetrics.avgTicket)}
        delta={todayMetrics.vsYesterday.avgTicket}
        deltaLabel="vs. ontem"
        icon={<Users size={16} className="text-purple-400" />}
        color="text-purple-400"
        bgColor="bg-purple-400/10"
      />
    </div>
  )
}
