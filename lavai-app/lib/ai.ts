// Anthropic Claude API client — uses native fetch to avoid SDK dependency

import { fetchWithTimeout } from '@/lib/fetch-timeout'

export interface InsightData {
  atendimentosUltimos30Dias: number
  receitaUltimos30Dias: number
  receitaMesAnterior: number
  ticketMedio: number
  topServicos: Array<{ nome: string; count: number; receita: number }>
  clientesAtivos: number
  clientesNovos: number
  despesasTotal: number
  horariosPico: Array<{ hora: string; count: number }>
  diasMaisMovimentados: Array<{ dia: string; count: number }>
}

export interface Insight {
  titulo: string
  descricao: string
  acao: string
  impacto: 'alto' | 'médio' | 'baixo'
  categoria: 'receita' | 'custo' | 'clientes' | 'operação' | 'marketing'
}

const MOCK_INSIGHTS: Insight[] = [
  {
    titulo: 'Configure os Insights de IA',
    descricao: 'A chave da API Anthropic não está configurada. Os insights reais analisam seus dados de atendimentos, receita e clientes para gerar recomendações personalizadas.',
    acao: 'Adicione ANTHROPIC_API_KEY ao seu arquivo .env.local para ativar os insights reais.',
    impacto: 'alto',
    categoria: 'operação',
  },
  {
    titulo: 'Acompanhe seu Ticket Médio',
    descricao: 'O ticket médio é um dos indicadores mais importantes para crescimento. Aumentar em R$ 10 por atendimento com 100 atendimentos/mês gera R$ 1.000 a mais.',
    acao: 'Ofereça combos de serviços: lavagem + aspiração + cera com desconto de 10%.',
    impacto: 'alto',
    categoria: 'receita',
  },
  {
    titulo: 'Programa de Fidelidade Ativo',
    descricao: 'Clientes fiéis gastam 67% mais do que novos clientes. O módulo de fidelidade LAVAI já está disponível para ativar.',
    acao: 'Acesse a seção Fidelidade e configure pontos por serviço para reter clientes.',
    impacto: 'médio',
    categoria: 'clientes',
  },
  {
    titulo: 'Reduza Tempo Ocioso',
    descricao: 'Períodos sem atendimento representam custo fixo sem receita. Identifique os horários de baixo movimento e crie promoções para preenchê-los.',
    acao: 'Crie uma promoção "Happy Hour" com 15% de desconto entre 14h–16h.',
    impacto: 'médio',
    categoria: 'marketing',
  },
  {
    titulo: 'Controle de Despesas',
    descricao: 'Registre todas as despesas no módulo Financeiro para calcular seu lucro real. Sem esse controle, a margem real pode ser negativa sem que você perceba.',
    acao: 'Acesse Financeiro e cadastre suas despesas fixas mensais (aluguel, água, produtos).',
    impacto: 'alto',
    categoria: 'custo',
  },
]

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  }, 30_000) // IA pode demorar mais que o default de 15s

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const content = data.content?.[0]
  if (content?.type === 'text') return content.text
  return '[]'
}

export async function generateInsights(data: InsightData): Promise<Insight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return MOCK_INSIGHTS

  const prompt = `Você é um consultor especialista em lava-jatos no Brasil. Analise os dados abaixo e forneça 5 insights acionáveis e específicos para aumentar receita, reduzir custos e melhorar a operação. Seja direto, use dados concretos e sugira ações práticas.

Dados do lava-jato (últimos 30 dias):
- Atendimentos: ${data.atendimentosUltimos30Dias}
- Receita: R$ ${data.receitaUltimos30Dias.toFixed(2)}
- Receita mês anterior: R$ ${data.receitaMesAnterior.toFixed(2)}
- Ticket médio: R$ ${data.ticketMedio.toFixed(2)}
- Clientes ativos: ${data.clientesAtivos}
- Clientes novos: ${data.clientesNovos}
- Despesas: R$ ${data.despesasTotal.toFixed(2)}
- Top serviços: ${JSON.stringify(data.topServicos)}
- Horários de pico: ${JSON.stringify(data.horariosPico)}
- Dias mais movimentados: ${JSON.stringify(data.diasMaisMovimentados)}

Forneça exatamente 5 insights no formato JSON (retorne APENAS o JSON, sem texto adicional):
[
  {
    "titulo": "título do insight",
    "descricao": "análise detalhada com dados específicos",
    "acao": "ação concreta para implementar hoje",
    "impacto": "alto|médio|baixo",
    "categoria": "receita|custo|clientes|operação|marketing"
  }
]`

  try {
    const text = await callClaude(prompt, 1024)
    // Extract JSON from response (Claude may wrap in markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return MOCK_INSIGHTS
    const parsed = JSON.parse(jsonMatch[0]) as Insight[]
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_INSIGHTS
    return parsed
  } catch {
    return MOCK_INSIGHTS
  }
}

export async function generateWeeklyReport(data: InsightData): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return `**Resumo da Semana**\n\nConfigure a chave ANTHROPIC_API_KEY para receber relatórios executivos personalizados com análise real dos seus dados de atendimentos, receita e crescimento de clientes.\n\n**Pontos Positivos**\n- Sistema LAVAI ativo e registrando dados\n- Módulo de fidelidade disponível\n\n**Pontos de Atenção**\n- API de IA não configurada\n- Despesas podem não estar sendo registradas\n\n**Meta para Próxima Semana**\nConfigure ANTHROPIC_API_KEY e registre todas as despesas fixas no módulo Financeiro.`
  }

  const prompt = `Escreva um relatório executivo semanal para um dono de lava-jato com esses dados: ${JSON.stringify(data)}. 
Formato em markdown: parágrafo de resumo (2 linhas), pontos positivos (lista), pontos de atenção (lista), meta para próxima semana. Em português brasileiro, tom profissional e direto.`

  try {
    return await callClaude(prompt, 800)
  } catch {
    return 'Não foi possível gerar o relatório narrativo. Tente novamente mais tarde.'
  }
}
