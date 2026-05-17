'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Atendimento {
  id: string
  cliente_nome: string
  servico_nome?: string
  placa?: string
  modelo?: string
  status: string
  preco_final?: number
  created_at: string
}

interface TopServico {
  nome: string
  count: number
  receita: number
}

interface DayRevenue {
  date: string
  receita: number
}

interface DashboardStats {
  atendimentosHoje: number
  receitaMes: number
  clientesNovos: number
  filaAtual: Atendimento[]
  topServicos: TopServico[]
  receitaUltimos7Dias: DayRevenue[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Erro ao carregar estatísticas')
      const json = await res.json()
      setStats(json.data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    // Poll every 30 seconds
    intervalRef.current = setInterval(fetch_, 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetch_])

  return { stats, loading, error, refetch: fetch_ }
}
