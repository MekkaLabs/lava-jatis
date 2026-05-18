# LAVAI — Handoff Completo para Novo Chat

> SaaS para donos de lava-jatos no Brasil. MVP funcional em Next.js 14 + Supabase.
> Repositório: https://github.com/MekkaLabs/lava-jatis

---

## 👤 Contexto do Usuário

- **Nome:** Gusta (gustavovicente)
- **Perfil:** Empreendedor dev autodidata, foco em produtos IA e marketing digital
- **Stack pessoal:** Cursor, VS Code, Obsidian, Adobe, Canva, Leonardo.ai, OpusClip, GitHub
- **Framework:** aios-core (multi-agentes)
- **Email:** gustav0.v1c3nt3@gmail.com

---

## 🎯 Produto — LAVAI

**Missão:** Digitalizar os 400 mil lava-jatos do Brasil com IA e automação.

**Planos:**
| Plano | Preço | Limite |
|-------|-------|--------|
| Básico | R$97/mês | 1 unidade, 3 funcionários |
| Profissional | R$197/mês | 3 unidades, ilimitados, WhatsApp bot |
| Enterprise | R$599/mês | Ilimitado, API, suporte dedicado |

**Design System:**
- `bg: #08090f` — fundo principal
- `surface: #0f1117` — cards e painéis
- `border: #1a1a2e` — bordas
- `cyan: #00d4ff` — cor primária / ações
- `green: #00e676` — sucesso / receita
- `yellow: #ffd600` — alertas / aguardando
- Fonte: Inter. Idioma: Português (Brasil).

---

## 🗂️ Estrutura do Projeto

```
lava-jatis/
├── lavai-app/                  ← Next.js 14 App Router (principal)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          ← Login com Supabase
│   │   │   ├── cadastro/       ← Signup + insert lava_jatos
│   │   │   └── recuperar-senha/
│   │   ├── dashboard/          ← Server Component + dados reais Supabase
│   │   │   └── components/     ← MetricCard, RevenueChart, FilaCard, AIInsightPanel
│   │   ├── fila/               ← Fila em tempo real (Supabase Realtime)
│   │   ├── clientes/           ← CRUD completo com slide-over
│   │   ├── financeiro/         ← KPIs, AreaChart 30 dias, despesas, export CSV
│   │   ├── agendamentos/       ← Calendário semanal
│   │   ├── fidelidade/         ← Pontos, ranking, recompensas
│   │   ├── whatsapp/           ← Bot Z-API: inbox, configuração
│   │   ├── relatorio/          ← PDF real com @react-pdf/renderer
│   │   ├── insights/           ← AI insights via Claude Haiku
│   │   ├── planos/             ← Checkout Asaas (PIX/Cartão/Boleto)
│   │   ├── configuracoes/      ← 5 tabs: Perfil, Plano, Notif, Integrações, Avançado
│   │   └── api/
│   │       ├── atendimentos/   ← GET/POST/PATCH/DELETE + [id]/pontuar
│   │       ├── clientes/       ← GET (search+pagination) / POST / [id]
│   │       ├── funcionarios/   ← CRUD completo
│   │       ├── dashboard/stats ← 6 métricas em 1 call, cache 60s
│   │       ├── ai/insights     ← Claude Haiku, cache 1h
│   │       ├── fidelidade/     ← pontos, recompensas, resgates, config
│   │       ├── payments/       ← Asaas: create-subscription, webhook, cancel
│   │       ├── whatsapp/       ← webhook/[lavaJatoId], config, send, status, conversas
│   │       ├── email/          ← welcome, weekly-report (Resend)
│   │       ├── relatorio/      ← pdf, email, preview, config
│   │       ├── push/           ← subscribe, unsubscribe, send (VAPID)
│   │       └── health/         ← healthcheck
│   ├── lib/
│   │   ├── supabase.ts         ← Browser client + createClient factory
│   │   ├── supabase-server.ts  ← Server client com cookie SSR
│   │   ├── asaas.ts            ← Asaas API client (sandbox/prod)
│   │   ├── zapi.ts             ← Z-API WhatsApp client
│   │   ├── ai.ts               ← Claude Haiku client (fetch nativo)
│   │   ├── email.ts            ← Resend + templates HTML
│   │   ├── email-templates.ts  ← 5 templates dark-theme
│   │   ├── push.ts             ← Web Push VAPID
│   │   ├── fidelidade.ts       ← Lógica de pontos e níveis
│   │   ├── bot/conversation.ts ← State machine WhatsApp (8 estados)
│   │   ├── pdf/RelatorioPDF.tsx ← PDF A4 com @react-pdf/renderer
│   │   ├── cache.ts            ← Cache in-memory por lava_jato_id
│   │   ├── constants.ts        ← PLANS, STATUS_COLORS, SERVICOS_DEFAULTS
│   │   ├── format.ts           ← BRL, datas relativas, placa, CPF, saudação
│   │   ├── validation.ts       ← Validação de inputs
│   │   ├── api-helpers.ts      ← requireAuth(), rate limiting, sanitização
│   │   ├── logger.ts           ← Logger estruturado
│   │   ├── analytics.ts        ← GA helper
│   │   └── hooks/
│   │       ├── useAtendimentos.ts
│   │       ├── useClientes.ts
│   │       ├── useDashboardStats.ts ← polling 30s
│   │       ├── useDebounce.ts
│   │       └── useLocalStorage.ts
│   ├── components/
│   │   ├── Sidebar.tsx         ← Colapsável, overlay mobile, logout
│   │   ├── Header.tsx
│   │   ├── FidelidadeBadge.tsx ← Bronze/Prata/Ouro/Diamante
│   │   ├── PushNotificationManager.tsx
│   │   ├── ServiceWorkerRegistration.tsx
│   │   ├── GoogleAnalytics.tsx
│   │   └── ui/
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── EmptyState.tsx
│   │       └── LoadingSpinner.tsx
│   ├── supabase/
│   │   ├── schema.sql          ← 6 tabelas principais + RLS + ALTER colunas pagamento
│   │   ├── fidelidade_schema.sql ← 5 tabelas fidelidade
│   │   ├── whatsapp_schema.sql ← 3 tabelas WhatsApp
│   │   ├── push_subscriptions.sql
│   │   └── indexes.sql         ← 16 índices de performance
│   ├── public/
│   │   └── sw.js               ← Service Worker (cache-first + push handler)
│   ├── middleware.ts            ← Protege /dashboard /fila /financeiro /clientes /equipe
│   ├── .env.example            ← Todas as variáveis necessárias
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
├── index.html                  ← Hub central (links para todos os módulos)
├── lavai-landing.html          ← Landing page marketing
├── lavai-dashboard.html        ← Dashboard HTML standalone
├── lavai-mobile.html           ← PWA mobile (5 telas)
├── lavai-onboarding.html       ← Wizard 5 passos
├── lavai-fidelidade.html       ← Módulo fidelidade HTML
├── lavai-whatsapp.html         ← Simulador bot WhatsApp
├── lavai-relatorio.html        ← Relatório semanal HTML
├── lavai-404.html              ← Página 404
├── supabase/schema.sql         ← Schema base (duplicado para referência)
├── vercel.json                 ← Deploy estático (region: gru1)
├── .gitignore
├── COMO_RODAR.md
├── DEPLOY.md
├── LAVAI_ROADMAP.md
├── LAVAI_STACK_TECNICA.md
└── LAVAI_VISAO_PRODUTO.md
```

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas principais (`schema.sql`)
| Tabela | Descrição |
|--------|-----------|
| `lava_jatos` | Multi-tenant root. FK: `owner_id → auth.users` |
| `servicos` | Catálogo de serviços por lava-jato |
| `clientes` | Clientes com pontos e nível fidelidade |
| `atendimentos` | OS: aguardando → em_andamento → concluido |
| `despesas` | Lançamentos financeiros |
| `funcionarios` | Equipe do lava-jato |

### Tabelas adicionais
| Tabela | Arquivo |
|--------|---------|
| `pontos_clientes`, `pontos_transacoes`, `recompensas`, `resgates`, `fidelidade_config` | `fidelidade_schema.sql` |
| `whatsapp_conversas`, `whatsapp_mensagens`, `whatsapp_config` | `whatsapp_schema.sql` |
| `push_subscriptions` | `push_subscriptions.sql` |

> **IMPORTANTE:** Todas as tabelas têm RLS habilitado. Padrão de acesso: `owner_id = auth.uid()` em `lava_jatos`, FKs nas demais.

### SQL para rodar no Supabase Dashboard (ordem):
```sql
-- 1. Schema principal
lavai-app/supabase/schema.sql

-- 2. Fidelidade
lavai-app/supabase/fidelidade_schema.sql

-- 3. WhatsApp
lavai-app/supabase/whatsapp_schema.sql

-- 4. Push
lavai-app/supabase/push_subscriptions.sql

-- 5. Indexes (performance)
lavai-app/supabase/indexes.sql
```

---

## 🔑 Variáveis de Ambiente

Copiar `.env.example` → `.env.local`:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Asaas (pagamentos BR)
ASAAS_API_KEY=...
ASAAS_ENV=sandbox                    # → production em prod
ASAAS_WEBHOOK_TOKEN=...

# Resend (emails)
RESEND_API_KEY=...
FROM_EMAIL=no-reply@lavai.com.br

# Anthropic (AI insights)
ANTHROPIC_API_KEY=...

# Z-API (WhatsApp)
ZAPI_INSTANCE_ID=...
ZAPI_TOKEN=...
ZAPI_CLIENT_TOKEN=...

# Web Push VAPID (gerar: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Cron jobs
CRON_SECRET=...
```

---

## 📦 Dependências

```json
{
  "next": "14.2.5",
  "react": "^18",
  "recharts": "^2.12.7",
  "lucide-react": "^0.400.0",
  "framer-motion": "^11.2.12",
  "date-fns": "^3.6.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.3.0",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.1.0",
  "resend": "^3.0.0",
  "web-push": "^3.6.7",
  "@react-pdf/renderer": "^3.4.0"
}
```

---

## 🚀 Como Rodar

```bash
cd ~/Documents/Claude/Projects/lava-jatis/lavai-app
npm install
cp .env.example .env.local
# Preencher .env.local com suas keys

npm run dev
# → http://localhost:3000
```

---

## 🌐 Deploy

- **Plataforma:** Vercel
- **Região:** gru1 (São Paulo)
- **Repo:** https://github.com/MekkaLabs/lava-jatis
- **Deploy automático:** push na branch `main` → Vercel CI/CD

```bash
# Push para GitHub (Vercel deploy automático)
cd ~/Documents/Claude/Projects/lava-jatis
rm -f .git/HEAD.lock .git/index.lock
git add .
git commit -m "feat: descrição"
git push origin main
```

> **Nota:** O git às vezes cria `.git/HEAD.lock` ou `.git/index.lock` no sandbox. Sempre fazer `rm -f .git/HEAD.lock .git/index.lock` antes de commitar.

---

## ✅ O Que Foi Construído

### Squads já executados (39 tasks concluídas):

| Squad | Entregas |
|-------|---------|
| **Core MVP** | Next.js 14, TailwindCSS, estrutura de rotas, Sidebar, Header |
| **Auth** | Login, Cadastro, Recuperar senha, Middleware de proteção |
| **Supabase** | Schema completo, RLS, tipos TypeScript, clients browser/server |
| **Dashboard** | Server Component, 6 queries paralelas, MetricCard, RevenueChart, FilaCard |
| **CRUD API** | 7 entidades, validação, rate limiting, cache, requireAuth() |
| **Fila** | Realtime Supabase, status transitions, modal Nova OS |
| **Clientes** | Busca debounced, paginação, slide-over, histórico de OS |
| **Financeiro** | KPIs, AreaChart, despesas, export CSV |
| **Agendamentos** | Calendário semanal, modal com autocomplete |
| **Configurações** | 5 tabs, upload logo, horários, zona de perigo |
| **Fidelidade** | Pontos reais por OS, ranking, recompensas, resgates |
| **WhatsApp Bot** | Z-API, state machine 8 estados, webhook por lava-jato, inbox |
| **AI Insights** | Claude Haiku, 8 métricas, cache 1h, painel colapsável |
| **PDF Real** | @react-pdf/renderer, layout A4, dados reais Supabase |
| **Email** | Resend, 5 templates dark-theme, welcome + relatório semanal |
| **Push PWA** | Service Worker, VAPID, subscribe/send por usuário |
| **SEO** | metadata, sitemap, robots, manifest, JSON-LD |
| **Pagamentos** | Asaas, PIX/Cartão/Boleto, webhook plano_status |
| **Security** | requireAuth() com getUser(), rate limiting, headers segurança |
| **Performance** | Promise.all, cache 60s, 16 indexes SQL |
| **Landing** | Hero animado, calculadora ROI, FAQ, depoimentos, planos |
| **HTMLs** | 8 páginas standalone: landing, dashboard, mobile PWA, onboarding, fidelidade, whatsapp, relatorio, 404 |

---

## 🔜 Próximas Melhorias (Pendentes)

### Alta prioridade
- [ ] **Domínio + Deploy ao vivo** — apontar `lavai.com.br` para Vercel
- [ ] **`npm run build` sem erros** — verificar TypeScript e corrigir erros de build
- [ ] **Configurar conta Asaas** — modo produção, webhook registrado
- [ ] **Configurar Resend** — domínio verificado, FROM_EMAIL ativo
- [ ] **Rodar SQLs no Supabase** — todos os 5 arquivos em ordem

### Features futuras
- [ ] **Multi-unidade** — lava-jatos com múltiplos endereços (plano Enterprise)
- [ ] **App nativo** — React Native / Expo com mesmo backend
- [ ] **Relatório de funcionário** — produtividade, OS por funcionário, comissão
- [ ] **Agendamento público** — link `lavai.app/agendar/[slug]` para clientes agendarem
- [ ] **Integração Google Meu Negócio** — sync de avaliações
- [ ] **NPS automático** — pesquisa satisfação via WhatsApp após OS concluída
- [ ] **Multi-tenant admin panel** — painel para a LAVAI gerenciar todos os clientes SaaS
- [ ] **Onboarding conectado ao banco** — wizard salva dados reais no Supabase
- [ ] **Chatbot IA no atendimento** — Claude responde dúvidas dos clientes do lava-jato

---

## 🧠 Padrões e Convenções

### Auth pattern (API routes)
```typescript
import { requireAuth } from '@/lib/api-helpers'

export async function GET(req: Request) {
  const { user, lavaJatoId, error } = await requireAuth(req)
  if (error) return error // já retorna Response 401
  // ... usar lavaJatoId para filtrar dados
}
```

### Supabase Server Client
```typescript
import { createServerClient } from '@/lib/supabase-server'
const supabase = createServerClient() // usa cookies() internamente
```

### Formatação BRL
```typescript
import { formatBRL, formatRelativeDate, formatPlaca } from '@/lib/format'
```

### Rate limiting
```typescript
import { rateLimit } from '@/lib/api-helpers'
const limited = await rateLimit(ip, 'endpoint-name', 10, 60) // 10 req/min
```

---

## 📝 Notas Importantes

1. **Branch main** está no GitHub: https://github.com/MekkaLabs/lava-jatis
2. **Último commit:** `feat: 5 squads — UX premium, páginas completas, security hardening, performance, landing`
3. **Arquivos locais não commitados ainda:** AI insights, PDF, fidelidade real, WhatsApp bot real (Tasks #36–39)
4. **node_modules** não está no repo (`.gitignore`). Sempre rodar `npm install` após clonar.
5. **`supabase/schema.sql`** na raiz é cópia de referência. Os arquivos oficiais estão em `lavai-app/supabase/`.
6. **WhatsApp bot:** webhook URL é por lava-jato: `/api/whatsapp/webhook/[lavaJatoId]`
7. **AI Insights:** tem fallback de 5 insights mock quando `ANTHROPIC_API_KEY` não configurada.
8. **PDF:** usa `@react-pdf/renderer`, não Puppeteer (sem servidor headless necessário).
9. **Git lock:** sempre remover `rm -f .git/HEAD.lock .git/index.lock` antes de commitar pelo terminal.
