// Zod-free schema validators for LAVAI API routes

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const VALID_ATENDIMENTO_STATUS = ['aguardando', 'em_andamento', 'concluido', 'cancelado'] as const

export const AtendimentoSchema = {
  create: (data: any): ValidationResult => {
    const errors: string[] = []
    if (!data || typeof data !== 'object') return { valid: false, errors: ['Body inválido'] }

    if (!data.servicoId && !data.servico_id) errors.push('servicoId é obrigatório')
    if (!data.clienteNome && !data.clienteId && !data.cliente_id) {
      errors.push('clienteNome ou clienteId é obrigatório')
    }
    if (data.clienteNome && typeof data.clienteNome === 'string' && data.clienteNome.trim().length > 200) {
      errors.push('clienteNome deve ter no máximo 200 caracteres')
    }
    if (data.placa && typeof data.placa === 'string' && data.placa.trim().length > 10) {
      errors.push('placa inválida')
    }
    if (data.observacao && typeof data.observacao === 'string' && data.observacao.trim().length > 2000) {
      errors.push('observacao deve ter no máximo 2000 caracteres')
    }

    return { valid: errors.length === 0, errors }
  },

  update: (data: any): ValidationResult => {
    const errors: string[] = []
    if (!data || typeof data !== 'object') return { valid: false, errors: ['Body inválido'] }

    if (data.status !== undefined) {
      if (!VALID_ATENDIMENTO_STATUS.includes(data.status)) {
        errors.push(`status deve ser um de: ${VALID_ATENDIMENTO_STATUS.join(', ')}`)
      }
    }
    if (data.preco_final !== undefined) {
      const preco = Number(data.preco_final)
      if (isNaN(preco) || preco < 0) errors.push('preco_final deve ser um número não-negativo')
    }
    if (data.observacao && typeof data.observacao === 'string' && data.observacao.trim().length > 2000) {
      errors.push('observacao deve ter no máximo 2000 caracteres')
    }

    return { valid: errors.length === 0, errors }
  },
}

export const ClienteSchema = {
  create: (data: any): ValidationResult => {
    const errors: string[] = []
    if (!data || typeof data !== 'object') return { valid: false, errors: ['Body inválido'] }

    if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
      errors.push('nome é obrigatório')
    } else if (data.nome.trim().length > 200) {
      errors.push('nome deve ter no máximo 200 caracteres')
    }

    if (!data.telefone || typeof data.telefone !== 'string' || data.telefone.trim().length === 0) {
      errors.push('telefone é obrigatório')
    } else {
      const tel = data.telefone.replace(/\D/g, '')
      if (tel.length < 10 || tel.length > 11) errors.push('telefone deve ter 10 ou 11 dígitos')
    }

    if (data.email && typeof data.email === 'string' && data.email.trim().length > 0) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(data.email.trim())) errors.push('email inválido')
      if (data.email.trim().length > 254) errors.push('email muito longo')
    }

    if (data.cpf && typeof data.cpf === 'string') {
      const doc = data.cpf.replace(/\D/g, '')
      if (doc.length !== 11 && doc.length !== 14) errors.push('CPF deve ter 11 dígitos ou CNPJ 14 dígitos')
    }

    return { valid: errors.length === 0, errors }
  },

  update: (data: any): ValidationResult => {
    const errors: string[] = []
    if (!data || typeof data !== 'object') return { valid: false, errors: ['Body inválido'] }

    if (data.nome !== undefined) {
      if (typeof data.nome !== 'string' || data.nome.trim().length === 0) errors.push('nome não pode ser vazio')
      else if (data.nome.trim().length > 200) errors.push('nome deve ter no máximo 200 caracteres')
    }

    if (data.telefone !== undefined) {
      const tel = String(data.telefone).replace(/\D/g, '')
      if (tel.length < 10 || tel.length > 11) errors.push('telefone deve ter 10 ou 11 dígitos')
    }

    if (data.email !== undefined && data.email !== null && data.email !== '') {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(String(data.email).trim())) errors.push('email inválido')
    }

    // Campos do veículo (opcionais). Aceita também `modelo` (vindo do form) como alias de modelo_veiculo.
    if (data.placa !== undefined && data.placa !== null && data.placa !== '') {
      const p = String(data.placa).trim().toUpperCase()
      if (!/^[A-Z0-9-]{4,10}$/.test(p)) errors.push('placa inválida (use letras, números e hífen, 4-10 chars)')
    }
    const modeloVal = data.modelo_veiculo ?? data.modelo
    if (modeloVal !== undefined && modeloVal !== null && modeloVal !== '') {
      if (String(modeloVal).length > 100) errors.push('modelo do veículo: máx 100 caracteres')
    }
    if (data.cor !== undefined && data.cor !== null && data.cor !== '') {
      if (String(data.cor).length > 30) errors.push('cor: máx 30 caracteres')
    }

    return { valid: errors.length === 0, errors }
  },
}

export const FuncionarioSchema = {
  create: (data: any): ValidationResult => {
    const errors: string[] = []
    if (!data || typeof data !== 'object') return { valid: false, errors: ['Body inválido'] }

    if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
      errors.push('nome é obrigatório')
    } else if (data.nome.trim().length > 200) {
      errors.push('nome deve ter no máximo 200 caracteres')
    }

    if (!data.cargo || typeof data.cargo !== 'string' || data.cargo.trim().length === 0) {
      errors.push('cargo é obrigatório')
    } else if (data.cargo.trim().length > 100) {
      errors.push('cargo deve ter no máximo 100 caracteres')
    }

    if (data.salario !== undefined && data.salario !== null) {
      const sal = Number(data.salario)
      if (isNaN(sal) || sal < 0) errors.push('salario deve ser um número não-negativo')
      if (sal > 1_000_000) errors.push('salario fora do intervalo permitido')
    }

    if (data.telefone !== undefined && data.telefone !== null && data.telefone !== '') {
      const tel = String(data.telefone).replace(/\D/g, '')
      if (tel.length < 10 || tel.length > 11) errors.push('telefone deve ter 10 ou 11 dígitos')
    }

    return { valid: errors.length === 0, errors }
  },

  update: (data: any): ValidationResult => {
    const errors: string[] = []
    if (!data || typeof data !== 'object') return { valid: false, errors: ['Body inválido'] }

    if (data.nome !== undefined) {
      if (typeof data.nome !== 'string' || data.nome.trim().length === 0) errors.push('nome não pode ser vazio')
      else if (data.nome.trim().length > 200) errors.push('nome deve ter no máximo 200 caracteres')
    }

    if (data.cargo !== undefined) {
      if (typeof data.cargo !== 'string' || data.cargo.trim().length === 0) errors.push('cargo não pode ser vazio')
      else if (data.cargo.trim().length > 100) errors.push('cargo deve ter no máximo 100 caracteres')
    }

    if (data.salario !== undefined && data.salario !== null) {
      const sal = Number(data.salario)
      if (isNaN(sal) || sal < 0) errors.push('salario deve ser um número não-negativo')
      if (sal > 1_000_000) errors.push('salario fora do intervalo permitido')
    }

    return { valid: errors.length === 0, errors }
  },
}

// Sanitize a string: trim + cap length
export function sanitizeString(value: any, maxLen = 500): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}
