'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    nomeLavaJato: '',
    cidade: '',
    whatsapp: '',
  })

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.senha !== form.confirmarSenha) {
      setError('As senhas nao conferem.')
      return
    }
    if (form.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        data: { nome: form.nome },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: insertError } = await supabase.from('lava_jatos').insert({
        owner_id: data.user.id,
        nome: form.nomeLavaJato,
        cidade: form.cidade || null,
        whatsapp: form.whatsapp || null,
      })

      if (insertError) {
        setError('Conta criada, mas houve um erro ao salvar os dados do lava-jato. Faca login e configure novamente.')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
  }

  const inputStyle = {
    backgroundColor: '#161728',
    border: '1px solid #2a2b3d',
  }

  function InputField({
    label,
    field,
    type = 'text',
    placeholder,
  }: {
    label: string
    field: keyof typeof form
    type?: string
    placeholder?: string
  }) {
    return (
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
        <input
          type={type}
          value={form[field]}
          onChange={e => update(field, e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg px-4 py-3 text-white text-sm outline-none transition"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#00d4ff')}
          onBlur={e => (e.target.style.borderColor = '#2a2b3d')}
        />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#08090f' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: '#00d4ff' }}
          >
            LAVAI
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Comece gratuitamente hoje</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: '#0d0e1a', borderColor: '#1a1b2e' }}
        >
          <h2 className="text-white text-xl font-semibold mb-6">Criar conta</h2>

          <form onSubmit={handleCadastro} className="space-y-4">
            {/* Divider: dados pessoais */}
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#00d4ff' }}>
              Dados pessoais
            </p>

            <InputField label="Nome completo" field="nome" placeholder="Joao Silva" />
            <InputField label="Email" field="email" type="email" placeholder="seu@email.com" />
            <InputField label="Senha" field="senha" type="password" placeholder="••••••••" />
            <InputField label="Confirmar senha" field="confirmarSenha" type="password" placeholder="••••••••" />

            {/* Divider: dados do lava-jato */}
            <p className="text-xs font-semibold uppercase tracking-widest pt-2" style={{ color: '#00d4ff' }}>
              Dados do lava-jato
            </p>

            <InputField label="Nome do lava-jato" field="nomeLavaJato" placeholder="Lava-Jato do Joao" />
            <InputField label="Cidade" field="cidade" placeholder="Sao Paulo, SP" />
            <InputField label="WhatsApp" field="whatsapp" placeholder="(11) 99999-9999" />

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: '#1f0a0a', color: '#ff6b6b', border: '1px solid #3d1010' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 font-semibold text-sm transition-opacity disabled:opacity-60 mt-2"
              style={{ backgroundColor: '#00e676', color: '#08090f' }}
            >
              {loading ? 'Criando conta...' : 'Criar conta gratis'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Ja tem uma conta?{' '}
          <Link href="/login" style={{ color: '#00d4ff' }} className="font-medium hover:opacity-80 transition-opacity">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
