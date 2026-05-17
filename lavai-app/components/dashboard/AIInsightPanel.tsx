'use client'

import { useState } from 'react'
import { Sparkles, TrendingUp, Users, Lightbulb, ArrowRight } from 'lucide-react'
import { aiInsights } from '@/lib/mock-data'
import type { AIInsight } from '@/types'

const typeConfig = {
  peak:     { icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  customer: { icon: Users,      color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  revenue:  { icon: TrendingUp, color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20' },
  tip:      { icon: Lightbulb,  color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/20' },
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const config = typeConfig[insight.type]
  const Icon = config.icon

  return (
    <div className={`rounded-xl p-3.5 flex gap-3 ${config.bg} border ${config.border}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
        <Icon size={14} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 leading-relaxed">{insight.message}</p>
        {insight.action && (
          <button className={`flex items-center gap-1 text-xs font-semibold mt-2 ${config.color}`}>
            {insight.action}
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function AIInsightPanel() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f8eff, #a855f7)' }}>
            <Sparkles size={13} color="#fff" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Insights da IA</h2>
            <p className="text-xs text-gray-500">Atualizado agora</p>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500) }}
          className="text-xs text-gray-500 hover:text-cyan-400 transition-colors font-medium">
          {loading ? 'Analisando...' : 'Atualizar'}
        </button>
      </div>

      <div className="space-y-2.5">
        {aiInsights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Sparkles size={12} className="text-gray-600" />
        <p className="text-xs text-gray-500">
          Powered by <span className="text-cyan-400 font-medium">LAVAI AI</span> · atualiza a cada 30 min
        </p>
      </div>
    </div>
  )
}
