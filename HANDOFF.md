# LAVAI — Handoff de Sessão (atualizado 2026-05-28)

> Documento de continuação. Leia junto com `CLAUDE.md` (contexto do produto),
> `GUIA_CONECTAR_SUPABASE.md` e `VERCEL_ENV_SETUP.md`.
> Vault de conhecimento: `~/Documents/lavai-obsidian/`.

---

## 🚦 Como continuar nesta nova aba

1. Ler `CLAUDE.md` — produto, stack, estrutura, padrões
2. Ler este `HANDOFF.md` — estado atual + aprendizados
3. Abrir o vault Obsidian → `LLM-CONNECT.md` + daily mais recente
4. Tasks: 70 de 79 completas (ver seção "Tasks pendentes")

---

## 📍 Estado do código

- **Branch:** `main` | **Repo:** https://github.com/MekkaLabs/lava-jatis
- **Último commit:** `695b73b` (fix auditoria AIOS multi-agente). Git **limpo**.
- **App:** `lavai-app/` (Next.js **14.2.35** App Router). Build passa (`tsc --noEmit` + `npm run build` exit 0).
- **Supabase:** REAL e conectado (projeto ref `rkubeyoxgojbtwqrrwmn`). Schema aplicado. 2 tenants existentes.
- **Vercel:** deploy pendente das env vars (ver `VERCEL_ENV_SETUP.md`).

### Métrica do código
46 rotas API · 22 páginas · 21 componentes · 0 testes automatizados (gap conhecido)

### Commits-chave da jornada (mais recente → antigo)
- `695b73b` — fix: auditoria AIOS (CVEs Next, persist clientes placa/modelo/cor, Realtime tenant filter, getUser dashboard, insights gate, WipBanner, RLS deny-default)
- `25a1e8f` — fix: cookie sem httpOnly (browser client precisa pra RLS)
- `56fb73f` — feat: ajustes MVP (autocomplete cliente, edit cliente, super-admin, guia)
- `1190187` — fix: regressões mobile/produção (loop redirect, CSP, SW)
- `0fdbccf` — feat: hardening segurança + PWA premium
- `489aff6` — feat: MVP hardening

---

## ▶️ Como rodar (LEIA — aprendizados)

⚠️ **`next dev` é INSTÁVEL nesta máquina** (cai, OOM). Use **`next start`** (produção):

```bash
cd ~/Documents/Claude/Projects/lava-jatis/lavai-app
npm run build
npm start -- -H 0.0.0.0
```

### Acesso de teste
- **IP local (mesma Wi-Fi):** `http://192.168.0.199:3000`
- **Tunnel (qualquer rede):** `cloudflared tunnel --url http://127.0.0.1:3000`
  - ⚠️ use **`127.0.0.1`** (IPv4), nunca `localhost` (resolve `::1` → connection refused)
  - sandbox do Claude bloqueia `*.trycloudflare.com` via TCP — não dá pra validar a URL pública por curl daqui; validar via 127.0.0.1
- **Login demo:** `admin` / `Am0cmph3@`

### ⚠️ Demo mode vs Supabase real
- `.env.local` tem `NEXT_PUBLIC_LAVAI_DEMO_ENABLED=true` (modo demo ATIVO localmente)
- `NEXT_PUBLIC_SUPABASE_URL` é REAL (`rkubeyoxgojbtwqrrwmn`)
- Pra testar com dados reais: setar `NEXT_PUBLIC_LAVAI_DEMO_ENABLED=false` + rebuild + logout/login
- **Tenant do Gusta:** "Mekka Wash" (lava_jato_id `1ec328a0-0e1c-4511-9690-a6ddfab015cb`) — já tem 7 serviços inseridos via SQL

---

## 🧠 Decisões críticas (ADRs no vault)

1. **ADR-001** — coluna canônica `user_id` (não owner_id). Schema único `supabase/SETUP_COMPLETO.sql`.
2. **ADR-002** — demo via flag `NEXT_PUBLIC_LAVAI_DEMO_ENABLED`. **Detecção única em `lib/demo.ts` (`IS_DEMO`)**.
3. **ADR-003** — NPS via link HMAC-signed.
4. **ADR-004** — webhook Asaas idempotente.
5. **ADR-005** — posicionamento "Piloto automático".
6. **ADR-006** — PWA premium + decisões de NÃO-fazer (sameSite strict, Expo).

### Regras de ouro aprendidas (não repetir os erros)
- **Detecção de demo SEMPRE via `IS_DEMO` de `lib/demo.ts`.** Cópias divergentes causaram loop de redirect + RLS anon.
- **Cookie de auth NÃO pode ser `httpOnly`** — `@supabase/ssr` browser client lê via `document.cookie` pra autenticar queries client-side. httpOnly → query anon → RLS retorna []. (Mitigação XSS: CSP strict + React escape + token TTL 1h.)
- **CSP sem `upgrade-insecure-requests`** — quebra acesso HTTP (IP local/dev).
- **Service Worker é v3 SEM cache** — cache-first servia assets velhos = "design zuado".
- **Realtime channel SEMPRE com `filter: lava_jato_id=eq.X`** — sem filter, payload de INSERT vaza entre tenants.

---

## 🐛 Auditoria AIOS multi-agente (commit 695b73b) — o que foi achado e corrigido

6 agentes (architect/devops/security/dev-qa/ux/data) varreram o sistema. **10 fixes aplicados:**

| Achado | Fix |
|--------|-----|
| Next 14.2.5 com 24 CVEs (Auth Bypass middleware) | bump → 14.2.35 |
| `/api/clientes` POST descartava placa/modelo/cor | adicionado ao insert |
| Realtime `/fila` vazava dados entre tenants | filter por lava_jato_id + guard |
| `/agendamentos` gerava mocks fake fora do demo | retorna [] + WipBanner |
| `/insights` mostrava "+17%🚀" sobre 0 OS | gate ≥10 OS com barra progresso |
| dashboard usava getSession() | trocado por getUser() |
| `/api/cadastro` sem rate limit | 3/h por IP + Turnstile |
| `/api/health` vazava version (fingerprint) | payload mínimo público |
| webhook_events/solicitacoes_lgpd sem RLS | deny-by-default (migration aplicada) |
| 3 telas "teatro" (toast verde, nada salva) | WipBanner honesto |

---

## ✅ Tasks pendentes (9 de 79)

### Bugs ainda abertos (eu consigo fazer)
- **#70** `/clientes` nunca faz GET em produção — useState `[]` sem fetch. Lista vazia após F5. **PRÓXIMO P0.**
- **#53** `/agendamentos` persistir (fetch + POST real, cadastrar cliente novo inline)
- **#55** `/equipe` persistir funcionários novos (era limitação demo, agora Supabase real)

### Dependem do Gusta
- **#17/18/19** Env vars no Vercel + deploy + smoke test (ver `VERCEL_ENV_SETUP.md`)
- **#23** Runway + kill date · **#24** validar "refém" presencial · **#27** plan B WhatsApp bot
- **#26** Sentry (free tier) — Cyber Chief recomendou reativar antes do go-live

### Registro pendente
- **#79** Salvar os 6 relatórios de agentes AIOS no vault (`03 - Agents/*-2026-05-28.md`)

---

## 🔒 Backlog de segurança (Cyber Chief — próximas 2 semanas)

Ordem recomendada (todos não-bloqueantes mas importantes pré-go-live):
1. `safeJsonLd()` no layout (escape do JSON-LD) — defesa XSS
2. Origin check no middleware pra POSTs (CSRF defense-in-depth) — cuidado com webhooks (Asaas/Z-API não mandam Origin)
3. Tabela `admin_audit_log` + INSERT na RPC admin
4. Reduzir JWT expiry pra 3600s no Supabase Dashboard
5. CSP nonce-based (mata `unsafe-inline`) — 1 dia de trabalho
6. TOTP MFA pros super-admins (Supabase Auth built-in)

---

## 🗂️ Arquivos-chave

| Arquivo | Para quê |
|---------|----------|
| `lib/demo.ts` | `IS_DEMO` (fonte única) + dados demo + `DEMO_CREDENTIALS` |
| `middleware.ts` | auth guard (getUser), rate limit, demo bypass, security headers |
| `lib/api-helpers.ts` | `requireAuth()`, rate limit, response helpers, sanitizeString |
| `lib/logger.ts` | logger com PII redaction |
| `lib/nps-signature.ts` | HMAC sign/verify NPS |
| `lib/turnstile.ts` | verifyTurnstile (no-op se sem chave) |
| `supabase/SETUP_COMPLETO.sql` | schema único idempotente (+ super_admins SECTION 12) |
| `components/NovaOSSheet.tsx` | bottom sheet Nova OS com autocomplete cliente |
| `components/ui/WipBanner.tsx` | banner "em desenvolvimento" reutilizável |
| `app/admin/page.tsx` | super-admin (lista tenants + MRR) |
| `app/api/admin/lava-jatos/route.ts` | RPC admin_list_lava_jatos |

---

## ▶️ Primeiro comando sugerido na nova aba

```bash
cd ~/Documents/Claude/Projects/lava-jatis/lavai-app
git log --oneline -3 && npm run build && npm start -- -H 0.0.0.0
```

**Pendência aberta pra retomar:** task #70 (`/clientes` GET real) é o próximo P0 — sem ela, lista de clientes fica vazia após F5 em produção. Depois #53 e #55 (persistência agendamentos/equipe).
