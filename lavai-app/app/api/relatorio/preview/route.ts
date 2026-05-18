// LAVAI — Relatório Preview API (returns KPI JSON for the page preview)
// GET /api/relatorio/preview?semana=YYYY-WW

import { NextRequest } from 'next/server'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { buildRelatorioData } from '../pdf/route'

function parseWeekParam(param: string | null): { year: number; week: number } {
  if (param && /^\d{4}-\d{1,2}$/.test(param)) {
    const [y, w] = param.split('-').map(Number)
    if (w >= 1 && w <= 53) return { year: y, week: w }
  }
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: now.getFullYear(), week }
}

export async function GET(req: NextRequest) {
  try {
    const { lavaJatoId } = await requireAuth(req)
    const { searchParams } = new URL(req.url)
    const { year, week } = parseWeekParam(searchParams.get('semana'))

    const data = await buildRelatorioData(lavaJatoId, year, week)

    return ok({
      kpis: data.kpis,
      periodo: data.periodo,
      lavaJatoNome: data.lavaJatoNome,
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error('[relatorio/preview]', e)
    return error('Erro interno', 500)
  }
}
