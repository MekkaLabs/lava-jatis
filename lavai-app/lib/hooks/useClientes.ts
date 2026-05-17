'use client'

import { useState, useEffect, useCallback } from 'react'

interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string
  cpf?: string
  created_at: string
}

interface CreatePayload {
  nome: string
  telefone: string
  email?: string
  cpf?: string
}

interface UpdatePayload {
  nome?: string
  telefone?: string
  email?: string
  cpf?: string
}

export function useClientes(query?: string) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetch_ = useCallback(async (q?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      const res = await fetch(`/api/clientes?${params.toString()}`)
      if (!res.ok) throw new Error('Erro ao carregar clientes')
      const json = await res.json()
      setClientes(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_(query) }, [query, fetch_])

  const create = useCallback(async (payload: CreatePayload) => {
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? 'Erro ao criar cliente')
    }
    const json = await res.json()
    setClientes(prev => [json.data, ...prev])
    setTotal(t => t + 1)
    return json.data
  }, [])

  const update = useCallback(async (id: string, payload: UpdatePayload) => {
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error ?? 'Erro ao atualizar cliente')
    }
    const json = await res.json()
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...json.data } : c))
    return json.data
  }, [])

  return { clientes, loading, error, total, create, update, refetch: fetch_ }
}
