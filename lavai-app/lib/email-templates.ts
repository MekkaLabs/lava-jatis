export interface WeeklyStats {
  atendimentos: number
  receitaTotal: number
  clientesNovos: number
  atendimentosSemanaAnterior: number
  receitaSemanaAnterior: number
  clientesNovosSemanaAnterior: number
  nomeEstabelecimento: string
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LAVAI</title>
</head>
<body style="margin:0;padding:0;background-color:#08090f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#08090f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1117 0%,#0a1628 50%,#0d1117 100%);border-radius:16px 16px 0 0;padding:40px 48px;text-align:center;border-bottom:2px solid #00d4ff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size:36px;font-weight:900;letter-spacing:4px;color:#00d4ff;text-shadow:0 0 20px rgba(0,212,255,0.4);">LAVAI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="background-color:#0d1117;padding:48px;border-radius:0;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0a0b10;border-radius:0 0 16px 16px;padding:32px 48px;border-top:1px solid #1a1d2e;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;font-size:13px;color:#4a5568;line-height:1.6;">
                      Você está recebendo este email porque tem uma conta no LAVAI.
                    </p>
                    <p style="margin:0;font-size:12px;color:#2d3748;">
                      Para cancelar o recebimento de emails, acesse as configurações da sua conta em
                      <a href="https://lavai.com.br/dashboard/configuracoes" style="color:#00d4ff;text-decoration:none;">lavai.com.br</a>.
                    </p>
                    <p style="margin:16px 0 0;font-size:12px;color:#1a1d2e;">
                      © ${new Date().getFullYear()} LAVAI. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:32px auto;">
      <tr>
        <td align="center" style="border-radius:10px;background:linear-gradient(135deg,#00d4ff,#00b8d9);">
          <a href="${href}" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#08090f;text-decoration:none;letter-spacing:0.5px;border-radius:10px;">${label}</a>
        </td>
      </tr>
    </table>`
}

function statBox(label: string, value: string, color: string): string {
  return `
    <td align="center" style="padding:0 8px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td align="center" style="background-color:#0f1320;border:1px solid #1a1d2e;border-radius:12px;padding:24px 16px;">
            <p style="margin:0 0 8px;font-size:28px;font-weight:800;color:${color};">${value}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;">${label}</p>
          </td>
        </tr>
      </table>
    </td>`
}

export function welcomeEmailTemplate(nome: string, nomeEstabelecimento: string): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">
      Bem-vindo ao LAVAI, ${nome}! 👋
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;">
      Seu estabelecimento <strong style="color:#00e676;">${nomeEstabelecimento}</strong> está configurado e pronto para decolar.
    </p>

    <p style="margin:0 0 24px;font-size:16px;color:#d1d5db;line-height:1.6;">
      Com o LAVAI, você tem tudo que precisa para modernizar seu lava-jato:
    </p>

    <!-- Feature 1 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#0f1320;border:1px solid #1a1d2e;border-left:3px solid #00d4ff;border-radius:8px;padding:20px 24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:16px;font-size:28px;">🚗</td>
              <td>
                <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffffff;">Fila Digital em Tempo Real</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Gerencie todos os atendimentos numa tela. Seus clientes acompanham a fila pelo celular.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Feature 2 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#0f1320;border:1px solid #1a1d2e;border-left:3px solid #00e676;border-radius:8px;padding:20px 24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:16px;font-size:28px;">💰</td>
              <td>
                <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffffff;">Financeiro Inteligente</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Receita, despesas, fluxo de caixa e relatórios automáticos toda semana no seu email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Feature 3 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:#0f1320;border:1px solid #1a1d2e;border-left:3px solid #7c3aed;border-radius:8px;padding:20px 24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:16px;font-size:28px;">⭐</td>
              <td>
                <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffffff;">Programa de Fidelidade</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Retenha clientes com pontos, cashback e recompensas personalizadas.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('https://lavai.com.br/dashboard', 'Acessar meu painel')}

    <p style="margin:32px 0 0;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
      Dúvidas? Responda este email ou acesse nosso suporte em
      <a href="https://lavai.com.br/suporte" style="color:#00d4ff;text-decoration:none;">lavai.com.br/suporte</a>.
    </p>
  `
  return baseTemplate(content)
}

export function paymentConfirmedEmailTemplate(
  nome: string,
  plano: string,
  valor: number
): string {
  const proximaCobranca = new Date()
  proximaCobranca.setMonth(proximaCobranca.getMonth() + 1)
  const dataFormatada = proximaCobranca.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const valorFormatado = valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const content = `
    <!-- Check icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:linear-gradient(135deg,rgba(0,230,118,0.15),rgba(0,230,118,0.05));border:2px solid #00e676;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:36px;">✓</div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;text-align:center;line-height:1.2;">
      Pagamento confirmado!
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;text-align:center;">
      Olá, <strong style="color:#ffffff;">${nome}</strong>. Seu plano está ativo.
    </p>

    <!-- Plan details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:#0f1320;border:1px solid #1a1d2e;border-radius:12px;padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:16px;border-bottom:1px solid #1a1d2e;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:14px;color:#6b7280;">Plano</td>
                    <td align="right" style="font-size:15px;font-weight:700;color:#00d4ff;">${plano}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;border-bottom:1px solid #1a1d2e;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:14px;color:#6b7280;">Valor pago</td>
                    <td align="right" style="font-size:15px;font-weight:700;color:#00e676;">${valorFormatado}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:14px;color:#6b7280;">Próxima cobrança</td>
                    <td align="right" style="font-size:15px;font-weight:600;color:#d1d5db;">${dataFormatada}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('https://lavai.com.br/dashboard', 'Ir para o painel')}

    <p style="margin:32px 0 0;font-size:14px;color:#6b7280;text-align:center;">
      Para gerenciar sua assinatura, acesse
      <a href="https://lavai.com.br/dashboard/plano" style="color:#00d4ff;text-decoration:none;">lavai.com.br/dashboard/plano</a>.
    </p>
  `
  return baseTemplate(content)
}

export function paymentOverdueEmailTemplate(nome: string, diasAtraso: number): string {
  const content = `
    <!-- Warning icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(251,191,36,0.05));border:2px solid #fbbf24;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:36px;">⚠️</div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;text-align:center;line-height:1.2;">
      Seu plano está vencido
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;text-align:center;">
      Olá, <strong style="color:#ffffff;">${nome}</strong>. Não se preocupe, é fácil regularizar.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:linear-gradient(135deg,rgba(251,191,36,0.1),rgba(251,191,36,0.05));border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:42px;font-weight:900;color:#fbbf24;">${diasAtraso}</p>
          <p style="margin:0;font-size:15px;color:#d97706;">${diasAtraso === 1 ? 'dia em atraso' : 'dias em atraso'}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:15px;color:#d1d5db;line-height:1.7;">
      Sua conta está temporariamente limitada. Para continuar usando todos os recursos do LAVAI — fila digital, financeiro, relatórios e fidelidade — regularize seu pagamento agora.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.7;">
      Aceitamos PIX, cartão de crédito e boleto. O acesso completo é restaurado em minutos após o pagamento.
    </p>

    ${ctaButton('https://lavai.com.br/dashboard/plano', 'Regularizar agora')}

    <p style="margin:32px 0 0;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
      Precisa de ajuda? Fale conosco em
      <a href="mailto:suporte@lavai.com.br" style="color:#00d4ff;text-decoration:none;">suporte@lavai.com.br</a>
      ou pelo WhatsApp no site.
    </p>
  `
  return baseTemplate(content)
}

export function weeklyReportEmailTemplate(nome: string, stats: WeeklyStats): string {
  const receitaFormatada = stats.receitaTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
  const receitaAnteriorFormatada = stats.receitaSemanaAnterior.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  function diffBadge(atual: number, anterior: number): string {
    if (anterior === 0) return ''
    const pct = Math.round(((atual - anterior) / anterior) * 100)
    const up = pct >= 0
    const color = up ? '#00e676' : '#f87171'
    const arrow = up ? '↑' : '↓'
    return `<span style="font-size:13px;color:${color};font-weight:600;">${arrow} ${Math.abs(pct)}%</span>`
  }

  const content = `
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">
      Relatório da semana
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:#00d4ff;font-weight:600;">
      ${stats.nomeEstabelecimento}
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#9ca3af;">
      Olá, <strong style="color:#ffffff;">${nome}</strong>! Aqui está o resumo da semana passada:
    </p>

    <!-- Stats grid -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        ${statBox('Atendimentos', stats.atendimentos.toString(), '#00d4ff')}
        ${statBox('Receita', receitaFormatada, '#00e676')}
        ${statBox('Clientes Novos', stats.clientesNovos.toString(), '#7c3aed')}
      </tr>
    </table>

    <!-- Comparison -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:#0f1320;border:1px solid #1a1d2e;border-radius:12px;padding:24px;">
          <p style="margin:0 0 20px;font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Comparação com semana anterior</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:12px;border-bottom:1px solid #1a1d2e;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:14px;color:#9ca3af;">Atendimentos</td>
                    <td align="center" style="font-size:14px;color:#6b7280;">${stats.atendimentosSemanaAnterior} → ${stats.atendimentos}</td>
                    <td align="right">${diffBadge(stats.atendimentos, stats.atendimentosSemanaAnterior)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #1a1d2e;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:14px;color:#9ca3af;">Receita</td>
                    <td align="center" style="font-size:14px;color:#6b7280;">${receitaAnteriorFormatada} → ${receitaFormatada}</td>
                    <td align="right">${diffBadge(stats.receitaTotal, stats.receitaSemanaAnterior)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:14px;color:#9ca3af;">Clientes Novos</td>
                    <td align="center" style="font-size:14px;color:#6b7280;">${stats.clientesNovosSemanaAnterior} → ${stats.clientesNovos}</td>
                    <td align="right">${diffBadge(stats.clientesNovos, stats.clientesNovosSemanaAnterior)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('https://lavai.com.br/dashboard', 'Ver painel completo')}
  `
  return baseTemplate(content)
}

export function passwordResetEmailTemplate(resetLink: string): string {
  const content = `
    <!-- Lock icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:linear-gradient(135deg,rgba(0,212,255,0.15),rgba(0,212,255,0.05));border:2px solid #00d4ff;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:36px;">🔐</div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;text-align:center;line-height:1.2;">
      Redefinir senha do LAVAI
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:#9ca3af;line-height:1.6;text-align:center;">
      Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#d1d5db;line-height:1.7;">
      Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong style="color:#fbbf24;">1 hora</strong>.
    </p>

    ${ctaButton(resetLink, 'Redefinir minha senha')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
      <tr>
        <td style="background-color:#0f1320;border:1px solid #1a1d2e;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Se não funcionar, copie e cole este link no navegador:</p>
          <p style="margin:0;font-size:13px;color:#00d4ff;word-break:break-all;">${resetLink}</p>
        </td>
      </tr>
    </table>

    <p style="margin:32px 0 0;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
      Se você não solicitou a redefinição de senha, ignore este email — sua conta permanece segura.
    </p>
  `
  return baseTemplate(content)
}
