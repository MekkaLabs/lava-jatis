// LAVAI — PDF Report Document Component
// Uses @react-pdf/renderer (server-side, no Puppeteer)

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RelatorioData {
  lavaJatoNome: string
  periodo: { inicio: string; fim: string }
  kpis: {
    receita: number
    receitaAnterior: number
    atendimentos: number
    atendimentosAnterior: number
    ticketMedio: number
    novosClientes: number
  }
  topServicos: Array<{ nome: string; count: number; receita: number }>
  atendimentosPorDia: Array<{ dia: string; count: number; receita: number }>
  formasPagamento: Array<{ forma: string; count: number; valor: number }>
  funcionarios: Array<{ nome: string; osCount: number; receita: number }>
  despesas: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return '+100%'
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function isPositive(current: number, previous: number): boolean {
  return current >= previous
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  dark:    '#0d0e1a',
  darker:  '#08090f',
  card:    '#1a1a2e',
  cyan:    '#00d4ff',
  green:   '#00e676',
  red:     '#f87171',
  white:   '#ffffff',
  gray:    '#a0a8b8',
  lightBg: '#f4f6fa',
  altRow:  '#eef0f6',
  border:  '#e2e6ef',
  accent:  '#7c3aed',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: C.card,
    padding: '24 32 20 32',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.cyan,
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 10,
    color: C.gray,
    marginTop: 2,
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  lavaJatoNome: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  headerMeta: {
    fontSize: 9,
    color: C.gray,
    marginTop: 3,
  },
  headerRule: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
    marginTop: 12,
  },

  // Body
  body: {
    padding: '20 32 0 32',
  },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.card,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 18,
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
    paddingLeft: 8,
  },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  kpiBox: {
    width: '47.5%',
    backgroundColor: C.lightBg,
    borderRadius: 6,
    padding: '12 14',
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
  },
  kpiLabel: {
    fontSize: 8,
    color: C.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.green,
  },
  kpiValueDark: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.card,
  },

  // Comparison rows
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  compLabel: {
    fontSize: 10,
    color: C.card,
    width: '30%',
  },
  compPrev: {
    fontSize: 9,
    color: C.gray,
    width: '22%',
    textAlign: 'right',
  },
  compArrow: {
    fontSize: 10,
    width: '8%',
    textAlign: 'center',
  },
  compCurrent: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.card,
    width: '25%',
    textAlign: 'right',
  },
  compPct: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    width: '15%',
    textAlign: 'right',
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.card,
    padding: '6 8',
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: C.cyan,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 8',
  },
  tableRowAlt: {
    backgroundColor: C.altRow,
  },
  tableCell: {
    fontSize: 9,
    color: C.card,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.card,
  },
  tableTotalRow: {
    flexDirection: 'row',
    padding: '7 8',
    backgroundColor: C.card,
    borderRadius: 4,
    marginTop: 2,
  },
  tableTotalCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.cyan,
  },

  // Bar chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 6,
    marginBottom: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barLabel: {
    fontSize: 7,
    color: C.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 6,
    color: C.gray,
    marginBottom: 2,
  },

  // Revenue analysis
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  revenueLabel: {
    fontSize: 10,
    color: C.card,
  },
  revenueValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.card,
  },
  revenueValueGreen: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.green,
  },
  revenueValueRed: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.red,
  },

  // Margin badge
  marginBadge: {
    backgroundColor: C.green,
    borderRadius: 4,
    padding: '4 10',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  marginText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.darker,
  },

  // Payment forms
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  payBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  payLabel: {
    fontSize: 9,
    color: C.card,
    width: 100,
  },
  payValue: {
    fontSize: 9,
    color: C.gray,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8 32',
    backgroundColor: C.card,
  },
  footerText: {
    fontSize: 8,
    color: C.gray,
  },
  footerBrand: {
    fontSize: 8,
    color: C.cyan,
    fontFamily: 'Helvetica-Bold',
  },
})

// ─── Column widths helpers ────────────────────────────────────────────────────

const col = (...widths: string[]) => widths.map((w, i) => ({ width: w }))

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>
}

function ComparisonRow({
  label,
  previous,
  current,
  currency = false,
}: {
  label: string
  previous: number
  current: number
  currency?: boolean
}) {
  const pos = isPositive(current, previous)
  const pct = pctChange(current, previous)
  const fmt = (v: number) => (currency ? formatBRL(v) : String(v))

  return (
    <View style={s.compRow}>
      <Text style={s.compLabel}>{label}</Text>
      <Text style={s.compPrev}>{fmt(previous)}</Text>
      <Text style={[s.compArrow, { color: pos ? C.green : C.red }]}>
        {pos ? '↑' : '↓'}
      </Text>
      <Text style={s.compCurrent}>{fmt(current)}</Text>
      <Text style={[s.compPct, { color: pos ? C.green : C.red }]}>{pct}</Text>
    </View>
  )
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function RelatorioPDF({ data }: { data: RelatorioData }) {
  const {
    lavaJatoNome,
    periodo,
    kpis,
    topServicos,
    atendimentosPorDia,
    formasPagamento,
    funcionarios,
    despesas,
  } = data

  const geradoEm = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const lucroLiquido = kpis.receita - despesas
  const margemPct = kpis.receita > 0 ? (lucroLiquido / kpis.receita) * 100 : 0
  const totalServicosReceita = topServicos.reduce((s, r) => s + r.receita, 0)

  // Bar chart max
  const maxReceita = Math.max(...atendimentosPorDia.map((d) => d.receita), 1)

  // Top funcionario
  const topFunc =
    funcionarios.length > 0
      ? funcionarios.reduce((a, b) => (a.receita > b.receita ? a : b))
      : null

  // Payment total
  const payTotal = formasPagamento.reduce((s, p) => s + p.valor, 0) || 1

  const formaLabel: Record<string, string> = {
    pix: 'PIX',
    cartao_credito: 'Cartão Crédito',
    cartao_debito: 'Cartão Débito',
    dinheiro: 'Dinheiro',
  }

  return (
    <Document
      title={`Relatório LAVAI — ${lavaJatoNome}`}
      author="LAVAI"
      subject="Relatório Semanal"
      creator="LAVAI"
    >
      <Page size="A4" style={s.page}>
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.logoText}>LAVAI</Text>
              <Text style={s.logoSub}>RELATÓRIO SEMANAL</Text>
            </View>
            <View style={s.headerRight}>
              <Text style={s.lavaJatoNome}>{lavaJatoNome}</Text>
              <Text style={s.headerMeta}>
                {periodo.inicio} – {periodo.fim}
              </Text>
              <Text style={s.headerMeta}>Gerado em {geradoEm}</Text>
            </View>
          </View>
          <View style={s.headerRule} />
        </View>

        {/* ── BODY ── */}
        <View style={s.body}>

          {/* ── SUMÁRIO EXECUTIVO ── */}
          <SectionTitle>Sumário Executivo</SectionTitle>
          <View style={s.kpiGrid}>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Receita Total</Text>
              <Text style={s.kpiValue}>{formatBRL(kpis.receita)}</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Total de Atendimentos</Text>
              <Text style={s.kpiValueDark}>{kpis.atendimentos}</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Ticket Médio</Text>
              <Text style={s.kpiValueDark}>{formatBRL(kpis.ticketMedio)}</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiLabel}>Novos Clientes</Text>
              <Text style={s.kpiValueDark}>{kpis.novosClientes}</Text>
            </View>
          </View>

          {/* ── DESEMPENHO VS SEMANA ANTERIOR ── */}
          <SectionTitle>Desempenho vs. Semana Anterior</SectionTitle>
          <ComparisonRow
            label="Receita"
            previous={kpis.receitaAnterior}
            current={kpis.receita}
            currency
          />
          <ComparisonRow
            label="Atendimentos"
            previous={kpis.atendimentosAnterior}
            current={kpis.atendimentos}
          />
          <ComparisonRow
            label="Novos Clientes"
            previous={0}
            current={kpis.novosClientes}
          />

          {/* ── TOP 5 SERVIÇOS ── */}
          <SectionTitle>Top 5 Serviços</SectionTitle>

          {/* Table header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: '45%' }]}>Serviço</Text>
            <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Qtd</Text>
            <Text style={[s.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Receita</Text>
            <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>% Total</Text>
          </View>

          {topServicos.slice(0, 5).map((sv, i) => {
            const pct =
              totalServicosReceita > 0
                ? ((sv.receita / totalServicosReceita) * 100).toFixed(1)
                : '0.0'
            return (
              <View
                key={i}
                style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
              >
                <Text style={[s.tableCell, { width: '45%' }]}>{sv.nome}</Text>
                <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>
                  {sv.count}
                </Text>
                <Text style={[s.tableCell, { width: '25%', textAlign: 'right' }]}>
                  {formatBRL(sv.receita)}
                </Text>
                <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>
                  {pct}%
                </Text>
              </View>
            )
          })}

          {/* Total row */}
          <View style={s.tableTotalRow}>
            <Text style={[s.tableTotalCell, { width: '45%' }]}>Total</Text>
            <Text style={[s.tableTotalCell, { width: '15%', textAlign: 'right' }]}>
              {topServicos.slice(0, 5).reduce((sum, r) => sum + r.count, 0)}
            </Text>
            <Text style={[s.tableTotalCell, { width: '25%', textAlign: 'right' }]}>
              {formatBRL(totalServicosReceita)}
            </Text>
            <Text style={[s.tableTotalCell, { width: '15%', textAlign: 'right' }]}>
              100%
            </Text>
          </View>

          {/* ── ATENDIMENTOS POR DIA (bar chart) ── */}
          <SectionTitle>Atendimentos por Dia</SectionTitle>
          <View style={s.chartContainer}>
            {atendimentosPorDia.map((d, i) => {
              const heightPct = d.receita / maxReceita
              const barH = Math.max(heightPct * 64, 4)
              return (
                <View key={i} style={s.barWrapper}>
                  <Text style={s.barValue}>{d.count}</Text>
                  <View
                    style={{
                      width: '80%',
                      height: barH,
                      backgroundColor: C.cyan,
                      borderRadius: 3,
                      opacity: 0.85,
                    }}
                  />
                  <Text style={s.barLabel}>{d.dia}</Text>
                </View>
              )
            })}
          </View>

        </View>

        {/* ── FOOTER page 1 ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>LAVAI</Text>
          <Text style={s.footerText}>Gerado em {geradoEm}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ── PAGE 2 ── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>

          {/* ── ANÁLISE DE RECEITA ── */}
          <SectionTitle>Análise de Receita</SectionTitle>

          <View style={s.revenueRow}>
            <Text style={s.revenueLabel}>Receita Bruta</Text>
            <Text style={s.revenueValue}>{formatBRL(kpis.receita)}</Text>
          </View>
          <View style={s.revenueRow}>
            <Text style={s.revenueLabel}>Despesas do Período</Text>
            <Text style={s.revenueValueRed}>− {formatBRL(despesas)}</Text>
          </View>
          <View style={[s.revenueRow, { borderBottomWidth: 0 }]}>
            <Text style={[s.revenueLabel, { fontFamily: 'Helvetica-Bold' }]}>
              Lucro Líquido
            </Text>
            <Text
              style={lucroLiquido >= 0 ? s.revenueValueGreen : s.revenueValueRed}
            >
              {formatBRL(lucroLiquido)}
            </Text>
          </View>

          <View style={s.marginBadge}>
            <Text style={s.marginText}>
              Margem {margemPct.toFixed(1)}%
            </Text>
          </View>

          {/* Formas de pagamento */}
          <Text
            style={[
              s.sectionTitle,
              { marginTop: 16, fontSize: 9, color: C.gray, borderLeftColor: C.gray },
            ]}
          >
            Formas de Pagamento
          </Text>

          {formasPagamento.map((fp, i) => {
            const pct = (fp.valor / payTotal) * 100
            return (
              <View key={i} style={s.payRow}>
                <Text style={s.payLabel}>
                  {formaLabel[fp.forma] || fp.forma}
                </Text>
                <View
                  style={[
                    s.payBar,
                    {
                      width: `${Math.round(pct)}%`,
                      backgroundColor: i === 0 ? C.cyan : i === 1 ? C.green : '#7c3aed',
                      maxWidth: 160,
                    },
                  ]}
                />
                <Text style={s.payValue}>
                  {formatBRL(fp.valor)} ({pct.toFixed(0)}%)
                </Text>
              </View>
            )
          })}

          {/* ── FUNCIONÁRIOS ── */}
          <SectionTitle>Funcionários</SectionTitle>

          {/* Table header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: '50%' }]}>Nome</Text>
            <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>
              OS Realizadas
            </Text>
            <Text style={[s.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>
              Receita Gerada
            </Text>
          </View>

          {funcionarios.map((f, i) => {
            const isTop = topFunc && f.nome === topFunc.nome
            return (
              <View
                key={i}
                style={[
                  s.tableRow,
                  i % 2 === 1 ? s.tableRowAlt : {},
                  isTop
                    ? {
                        borderLeftWidth: 3,
                        borderLeftColor: C.green,
                      }
                    : {},
                ]}
              >
                <Text
                  style={[
                    isTop ? s.tableCellBold : s.tableCell,
                    { width: '50%' },
                  ]}
                >
                  {f.nome}
                  {isTop ? ' ★' : ''}
                </Text>
                <Text
                  style={[s.tableCell, { width: '20%', textAlign: 'right' }]}
                >
                  {f.osCount}
                </Text>
                <Text
                  style={[s.tableCell, { width: '30%', textAlign: 'right' }]}
                >
                  {formatBRL(f.receita)}
                </Text>
              </View>
            )
          })}

          {topFunc && (
            <View
              style={{
                marginTop: 10,
                padding: '8 12',
                backgroundColor: '#e8fdf0',
                borderRadius: 5,
                borderLeftWidth: 3,
                borderLeftColor: C.green,
              }}
            >
              <Text style={{ fontSize: 9, color: '#166534', fontFamily: 'Helvetica-Bold' }}>
                Destaque da semana: {topFunc.nome}
              </Text>
              <Text style={{ fontSize: 8, color: '#166534', marginTop: 2 }}>
                {topFunc.osCount} atendimentos • {formatBRL(topFunc.receita)} em receita
              </Text>
            </View>
          )}

        </View>

        {/* ── FOOTER page 2 ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>LAVAI</Text>
          <Text style={s.footerText}>Gerado em {geradoEm}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
