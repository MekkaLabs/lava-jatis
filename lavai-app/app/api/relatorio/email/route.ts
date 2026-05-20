// LAVAI — Send Weekly Report via Email API
// POST /api/relatorio/email   body: { semana?: "YYYY-WW" }

import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { Resend } from 'resend'
import { requireAuth, error, ok } from '@/lib/api-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { RelatorioPDF } from '@/lib/pdf/RelatorioPDF'
import { buildRelatorioData } from '../pdf/route'
import { logger } from '@/lib/logger'

const FROM = process.env.FROM_EMAIL || 'no-reply@lavai.com.br'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(apiKey)
}

function parseWeekParam(param: string | null): { year: number; week: number } {
  if (param && /^\d{4}-\d{1,2}$/.test(param)) {
    const [y, w] = param.split('-').map(Number)
    if (w >= 1 && w <= 53) return { year: y, week: w }
  }
  const now = new Date()
  // ISO week calculation
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: now.getFullYear(), week }
}

function buildEmailHTML(data: Awaited<ReturnType<typeof buildRelatorioData>>): string {
  const { lavaJatoNome, periodo, kpis } = data
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const diff = (cur: number, prev: number) => {
    if (prev === 0) return ''
    const pct = ((cur - prev) / prev) * 100
    const up = pct >= 0
    return `<span style="color:${up ? '#00e676' : '#f87171'};font-weight:700;">${up ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%</span>`
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08090f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08090f;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#1a1a2e;border-radius:12px 12px 0 0;padding:32px 40px;">
          <p style="margin:0;font-size:28px;font-weight:900;color:#00d4ff;letter-spacing:3px;">LAVAI</p>
          <p style="margin:6px 0 0;font-size:14px;color:#a0a8b8;letter-spacing:1px;">RELATÓRIO SEMANAL</p>
          <p style="margin:16px 0 0;font-size:20px;font-weight:700;color:#ffffff;">${lavaJatoNome}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#a0a8b8;">Período: ${periodo.inicio} – ${periodo.fim}</p>
        </td></tr>

        <!-- KPI Cards -->
        <tr><td style="background:#ffffff;padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:12px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:1px;border-left:3px solid #00d4ff;padding-left:8px;">Sumário da Semana</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="background:#f4f6fa;border-radius:8px;padding:16px 20px;border-left:3px solid #00e676;">
                <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Receita Total</p>
                <p style="margin:6px 0 4px;font-size:22px;font-weight:800;color:#00a855;">${fmt(kpis.receita)}</p>
                <p style="margin:0;font-size:11px;color:#9ca3af;">${diff(kpis.receita, kpis.receitaAnterior)} vs semana anterior</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#f4f6fa;border-radius:8px;padding:16px 20px;border-left:3px solid #00d4ff;">
                <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Atendimentos</p>
                <p style="margin:6px 0 4px;font-size:22px;font-weight:800;color:#1a1a2e;">${kpis.atendimentos}</p>
                <p style="margin:0;font-size:11px;color:#9ca3af;">${diff(kpis.atendimentos, kpis.atendimentosAnterior)} vs semana anterior</p>
              </td>
            </tr>
            <tr><td colspan="3" style="height:12px;"></td></tr>
            <tr>
              <td width="48%" style="background:#f4f6fa;border-radius:8px;padding:16px 20px;border-left:3px solid #7c3aed;">
                <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Ticket Médio</p>
                <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#1a1a2e;">${fmt(kpis.ticketMedio)}</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#f4f6fa;border-radius:8px;padding:16px 20px;border-left:3px solid #f59e0b;">
                <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Novos Clientes</p>
                <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#1a1a2e;">${kpis.novosClientes}</p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin-top:28px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.lavai.com.br'}/relatorio"
               style="display:inline-block;background:#00d4ff;color:#08090f;font-weight:700;font-size:14px;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
              Ver Relatório Completo
            </a>
          </div>
          <p style="text-align:center;margin-top:12px;font-size:11px;color:#9ca3af;">
            O PDF completo está em anexo neste email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#1a1a2e;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#4b5563;">
            Gerado automaticamente pelo <span style="color:#00d4ff;font-weight:700;">LAVAI</span> — Sistema para Lava-Jatos
          </p>
          <p style="margin:6px 0 0;font-size:10px;color:#374151;">
            Para cancelar o envio automático, acesse Configurações &gt; Relatórios no app.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId, lavaJatoId } = await requireAuth(req)

    const body = await req.json().catch(() => ({}))
    const { year, week } = parseWeekParam(body.semana || null)

    // Get user email
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return error('Email não encontrado', 400)

    // Build data & PDF
    const data = await buildRelatorioData(lavaJatoId, year, week)
    const buffer = await renderToBuffer(
      createElement(RelatorioPDF, { data }) as any
    )

    const weekLabel = `${year}-W${String(week).padStart(2, '0')}`
    const filename = `lavai-relatorio-${weekLabel}.pdf`

    // Send via Resend
    const resend = getResend()
    const { error: sendError } = await resend.emails.send({
      from: `LAVAI <${FROM}>`,
      to: user.email,
      subject: `Relatório Semanal — ${data.lavaJatoNome} (${data.periodo.inicio} a ${data.periodo.fim})`,
      html: buildEmailHTML(data),
      attachments: [
        {
          filename,
          content: Buffer.from(buffer).toString('base64'),
        },
      ],
    })

    if (sendError) {
      logger.error('relatorio.email.resend', sendError)
      return error('Falha ao enviar email', 500)
    }

    return ok({
      success: true,
      message: `Relatório enviado para ${user.email}`,
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    logger.error('relatorio.email', e)
    return error('Erro interno', 500)
  }
}
