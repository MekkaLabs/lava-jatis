'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface RevenueChartProps {
  data: Array<{ date: string; receita: number }>
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{ background: '#12152a', border: '1px solid rgba(0,212,255,0.2)' }}
    >
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-cyan-400">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
      </p>
    </div>
  )
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const total = data.reduce((a, d) => a + d.receita, 0)

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.15)' }}
          >
            <TrendingUp size={14} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Receita — Últimos 7 Dias</h2>
            <p className="text-xs text-gray-500">
              Total:{' '}
              <span className="text-cyan-400 font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1a1a2e" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="#00d4ff"
            strokeWidth={2.5}
            fill="url(#cyanGrad)"
            dot={{ fill: '#00d4ff', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#00d4ff', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
