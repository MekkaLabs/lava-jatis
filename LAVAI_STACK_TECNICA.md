# LAVAI — Stack Técnica Definitiva

> Filosofia: **gratuito primeiro, pago quando escalar.** Zero custo até os primeiros R$5k de receita.

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE FINAL                         │
│              (WhatsApp / Link Web / PWA)                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  FRONTEND                                │
│            Next.js 14 + TailwindCSS                     │
│               Deploy: Vercel (free)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   BACKEND / API                          │
│              Next.js API Routes + FastAPI                │
│            Deploy: Railway / Render (free tier)          │
└────────┬──────────────────────────────┬─────────────────┘
         │                              │
┌────────▼──────────┐        ┌──────────▼──────────────────┐
│    DATABASE       │        │        AI LAYER              │
│   Supabase        │        │   aios-core + Cerebrum       │
│  (PostgreSQL +    │        │   Claude API (MAX plan)      │
│   Auth + RT)      │        │   GPT-4o (backup)            │
│   free tier       │        │   LLM local (Ollama)         │
└───────────────────┘        └─────────────────────────────┘
         │
┌────────▼──────────────────────────────────────────────┐
│              INTEGRAÇÕES                               │
│  WhatsApp: Evolution API (self-hosted, free)          │
│  Pagamentos: MercadoPago API (free até usar)          │
│  Web3: Polygon (gas fees baixíssimas)                 │
│  Notificações: Resend (free tier 3k emails/mês)       │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Detalhada

### Frontend
| Tech | Por quê | Custo |
|------|---------|-------|
| **Next.js 14** | Full-stack, SSR, App Router, ideal para SaaS | Gratuito |
| **TailwindCSS** | UI rápida, responsiva, sem CSS custom | Gratuito |
| **shadcn/ui** | Componentes prontos e bonitos | Gratuito |
| **Zustand** | State management simples | Gratuito |
| **React Query** | Dados em tempo real sem Redux | Gratuito |

### Backend
| Tech | Por quê | Custo |
|------|---------|-------|
| **Next.js API Routes** | No MVP, backend junto com frontend | Gratuito |
| **FastAPI** (Fase 2+) | Python para IA agents, performance | Gratuito |
| **Supabase** | PostgreSQL + Auth + Realtime + Storage | Free até 500MB |
| **Prisma** | ORM type-safe para Node | Gratuito |

### IA & Agentes
| Tech | Por quê | Custo |
|------|---------|-------|
| **aios-core (AIOS)** | Orquestração de agentes IA | Open source |
| **Cerebrum SDK** | SDK oficial do AIOS | Open source |
| **Claude API** | Gusta tem MAX plan | Incluso |
| **GPT-4o** | Fallback / tarefas específicas | Tem acesso |
| **Ollama + Llama3** | LLM local para dados sensíveis | Gratuito |
| **LangChain** | Tooling para agents e RAG | Gratuito |

### WhatsApp & Comunicação
| Tech | Por quê | Custo |
|------|---------|-------|
| **Evolution API** | WhatsApp Bot self-hosted (não-oficial) | Gratuito |
| **Resend** | Emails transacionais | 3k/mês grátis |
| **Novu** | Orquestração de notificações | Free tier |

### Pagamentos
| Tech | Por quê | Custo |
|------|---------|-------|
| **MercadoPago** | PIX nativo, cartão, dominante no BR | 3.99% por transação |
| **Stripe** (Fase 2+) | Assinaturas SaaS, melhor DX | 2.9% + R$0.30 |

### Web3 (Fase 3)
| Tech | Por quê | Custo |
|------|---------|-------|
| **Polygon** | Gas fees baratas (<$0.001) | Quase zero |
| **Hardhat** | Deploy de smart contracts | Gratuito |
| **wagmi + viem** | Web3 frontend hooks | Gratuito |
| **IPFS** | Storage descentralizado para NFTs | Gratuito |

### DevOps & Deploy
| Tech | Por quê | Custo |
|------|---------|-------|
| **Vercel** | Deploy Next.js perfeito, CI/CD automático | Free tier |
| **Railway** | Backend FastAPI / containers | $5/mês (starter) |
| **GitHub** | Repositório + Actions CI/CD | Gratuito |
| **Sentry** | Monitoramento de erros | Free tier |

---

## 📁 Estrutura de Pastas (Monorepo)

```
lavai/
├── apps/
│   ├── web/                    # Next.js — dashboard do lava-jato
│   ├── landing/                # Next.js — site de vendas
│   └── api/                    # FastAPI — IA agents (Fase 2)
├── packages/
│   ├── ui/                     # Componentes compartilhados (shadcn)
│   ├── database/               # Schema Prisma + Supabase client
│   ├── ai/                     # aios-core agents e prompts
│   └── whatsapp/               # Evolution API client
├── contracts/                  # Smart contracts Solidity (Fase 3)
├── docs/                       # Documentação
└── scripts/                    # Setup, migrations, seeds
```

---

## ⚡ Custo Total Estimado por Fase

| Fase | Custo Mensal |
|------|-------------|
| **MVP (Fase 1)** | **R$ 0 — R$ 50/mês** |
| Produto (Fase 2) | R$ 100 — R$ 300/mês |
| Escala (Fase 3) | R$ 500 — R$ 1.500/mês |
| > 1.000 clientes | Custo coberto pela receita |

---

## 🔐 Segurança & Compliance

- Autenticação via Supabase Auth (JWT + RLS)
- LGPD compliant — dados de cliente criptografados
- Multi-tenant architecture — cada lava-jato isolado
- Rate limiting via Upstash Redis (free tier)

---

## 🤖 Agentes IA com aios-core

### Agent 1: SchedulerAgent
> Analisa histórico + horário atual e sugere melhores horários de agendamento

### Agent 2: CustomerAgent  
> Responde clientes via WhatsApp, agenda, informa status da fila

### Agent 3: InsightsAgent
> Gera relatórios automáticos semanais para o dono (receita, clientes, tendências)

### Agent 4: PricingAgent (Fase 2)
> Sugere precificação dinâmica baseada em demanda e concorrência

---

## 🚀 Comando de Setup (Um único comando)

```bash
curl -fsSL https://lavai.app/setup.sh | bash
```

Ou manual:
```bash
git clone https://github.com/seu-usuario/lavai
cd lavai
./scripts/setup.sh
```
