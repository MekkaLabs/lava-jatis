import { Resend } from 'resend'
import {
  welcomeEmailTemplate,
  paymentConfirmedEmailTemplate,
  paymentOverdueEmailTemplate,
  weeklyReportEmailTemplate,
  passwordResetEmailTemplate,
  WeeklyStats,
} from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'no-reply@lavai.com.br'
const FROM_NAME = 'LAVAI'

function from(): string {
  return `${FROM_NAME} <${FROM}>`
}

export async function sendWelcomeEmail(
  to: string,
  nome: string,
  nomeEstabelecimento: string
) {
  const { data, error } = await resend.emails.send({
    from: from(),
    to,
    subject: `Bem-vindo ao LAVAI, ${nome}! 🚗`,
    html: welcomeEmailTemplate(nome, nomeEstabelecimento),
  })

  if (error) {
    console.error('[email] sendWelcomeEmail error:', error)
    throw error
  }

  return data
}

export async function sendPaymentConfirmedEmail(
  to: string,
  nome: string,
  plano: string,
  valor: number
) {
  const { data, error } = await resend.emails.send({
    from: from(),
    to,
    subject: `Pagamento confirmado — Plano ${plano} ✓`,
    html: paymentConfirmedEmailTemplate(nome, plano, valor),
  })

  if (error) {
    console.error('[email] sendPaymentConfirmedEmail error:', error)
    throw error
  }

  return data
}

export async function sendPaymentOverdueEmail(
  to: string,
  nome: string,
  diasAtraso: number
) {
  const { data, error } = await resend.emails.send({
    from: from(),
    to,
    subject: `Seu plano LAVAI está vencido — Regularize agora`,
    html: paymentOverdueEmailTemplate(nome, diasAtraso),
  })

  if (error) {
    console.error('[email] sendPaymentOverdueEmail error:', error)
    throw error
  }

  return data
}

export async function sendWeeklyReportEmail(
  to: string,
  nome: string,
  stats: WeeklyStats
) {
  const { data, error } = await resend.emails.send({
    from: from(),
    to,
    subject: `Relatório da semana — ${stats.nomeEstabelecimento}`,
    html: weeklyReportEmailTemplate(nome, stats),
  })

  if (error) {
    console.error('[email] sendWeeklyReportEmail error:', error)
    throw error
  }

  return data
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const { data, error } = await resend.emails.send({
    from: from(),
    to,
    subject: `Redefinir senha do LAVAI`,
    html: passwordResetEmailTemplate(resetLink),
  })

  if (error) {
    console.error('[email] sendPasswordResetEmail error:', error)
    throw error
  }

  return data
}
