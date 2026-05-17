'use client'

import { useState, useEffect, useCallback } from 'react'

interface Atendimento {
  id: string
  cliente_nome: string
  placa?: string
  modelo?: string
  cor?: string
  status: 'aguardando' | 'em_andamento' | 'concluido' | 'cancelado'
  preco_final?: number
  observacao?: string
  created_at: string
  updated_at?: string
  clientes?: { id: string; nome: string; telefone: string }
  servicos?: { id: string; nome: string; preco: number }
  funcionarios?: { id: string; nome: string }
}

interface Filters {
  status?: string
  date?: string
}

interface CreatePayload {
  clienteId?: string
  clienteNome?: string
  servicoId: string
  placa?: string
  modelo?: string
  cor?: string
  observacao?: string
}

interface UpdatePayload {
  status?: string
  preco_final?: number
  observacao?: string
  funcionario_id?: string
}

export function useAtendimentos(filters?: Filters) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.date) params.set('date', filters.date)
    const qs = params.toString()
    return `/api/atendimentos${qs ? `?${qs}` : ''}`
  }, [filters?.status, filters?.date])

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildUrl())
      if (!res.ok) throw new Error('Erro ao carregar atendimentos')
      const json = await res.json()
      setAtendimentos(json.data ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => { fetch_() }, [fetch_])

  const create = useCallback(async (payload: CreatePayload) => {
    const res = await fetch('/api/atendimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? 'Erro ao criar atendimento')
    }
    const json = await res.json()
    setAtendimentos(prev => [json.data, ...prev])
    return json.data
  }, [])

  const update = useCallback(async (id: string, payload: UpdatePayload) => {
    const res = await fetch(`/api/atendimentos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? 'Erro ao atualizar atendimento')
    }
    const json = await res.json()
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, ...json.data } : a))
    return json.data
  }, [])

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/atendimentos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? 'Erro ao cancelar atendimento')
    }
    setAtendimentos(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'cancelado' as const } : a)
    )
  }, [])

  return { atendimentos, loading, error, create, update, remove, refetch: fetch_ }
}
