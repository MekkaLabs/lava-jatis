'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { weeklyData } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-cyan-400 font-bold">{payload[0].value} carros</p>
        <p className="text-green-400 font-semibold">{formatCurrency(payload[0].payload.revenue)}</p>
      </div>
    )
  }
  return null
}

export default function RevenueChart() {
  const maxCars = Math.max(...weeklyData.map(d => d.cars))

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-white text-sm">Carros por dia</h2>
          <p className="text-xs text-gray-500 mt-0.5">Últimos 7 dias</p>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-cyan-400/70"></span>
            Carros
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={weeklyData} barSize={28}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="cars" radius={[6, 6, 0, 0]}>
            {weeklyData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.cars === maxCars ? '#00d4ff' : 'rgba(79,142,255,0.4)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Week summary */}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center">
          <p className="text-xs text-gray-500">Total semana</p>
          <p className="text-sm font-bold text-white">{weeklyData.reduce((a, d) => a + d.cars, 0)} carros</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Receita semana</p>
          <p className="text-sm font-bold text-green-400">{formatCurrency(weeklyData.reduce((a, d) => a + d.revenue, 0))}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Melhor dia</p>
          <p className="text-sm font-bold text-cyan-400">Sábado</p>
        </div>
      </div>
    </div>
  )
}
