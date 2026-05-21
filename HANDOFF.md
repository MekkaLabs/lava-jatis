# LAVAI — Handoff de Sessão (2026-05-21)

> Documento de continuação. Leia junto com `CLAUDE.md` (contexto do produto) e
> `AGENTS.md`. Vault de conhecimento: `~/Documents/lavai-obsidian/`.

---

## 🚦 Como continuar nesta nova aba

1. Ler `CLAUDE.md` — produto, stack, estrutura, padrões
2. Ler este `HANDOFF.md` — estado atual + aprendizados desta sessão
3. Abrir o vault Obsidian (`~/Documents/lavai-obsidian/`) → `LLM-CONNECT.md` e o daily mais recente
4. Estado das tasks: ver seção "Tasks pendentes" abaixo

---

## 📍 Estado do código

- **Branch:** `main` | **Repo:** https://github.com/MekkaLabs/lava-jatis
- **Último commit:** `a11d969` (fixes mobile UX). Git **limpo** (tudo commitado e pushado).
- **App:** `lavai-app/` (Next.js 14 App Router). **Build passa** (`tsc --noEmit` exit 0, `npm run build` exit 0).

### Commits desta sessão (mais recente → antigo)
- `a11d969` — fix(mobile): FAB único, cards Fila/Clientes, calendário em lista
- `1190187` — fix: regressões mobile/produção (loop redirect, CSP, service worker)
- `0fdbccf` — feat: hardening segurança + PWA premium + limpeza
- `7261d5b` — feat: PWA premium (banner+tabs+FAB) + LGPD
- `489aff6` — feat: MVP hardening (segurança, mobile, onboarding, landing)

---

## ▶️ Como rodar (LEIA — aprendizado importante)

⚠️ **`next dev` é cronicamente INSTÁVEL nesta máquina** (cai sozinho, compila em 35s).
**Use build de produção (`next start`)** para testes estáveis:

```bash
cd ~/Documents/Claude/Projects/lava-jatis/lavai-app
npm run build
npm start -- -H 0.0.0.0   # escuta em 127.0.0.1 (tunnel) + IP local (Wi-Fi)
```

### Acesso
- **IP local (mesma Wi-Fi):** `http://192.168.0.199:3000`
- **Tunnel (qualquer rede):** `cloudflared tunnel --url http://127.0.0.1:3000`
  - ⚠️ aponte para **`127.0.0.1`** (IPv4), não `localhost` (resolve `::1` IPv6 e dá "connection refused")
  - a URL trycloudflare muda a cada restart
  - o sandbox do Claude bloqueia `*.trycloudflare.com` via TCP → não dá pra validar a URL pública por curl daqui; valide via `127.0.0.1` / IP local
- **Login demo:** `admin` / `Am0cmph3@`

### ⚠️ Demo mode depende de flag
Em produção (`next start`, `NODE_ENV=production`) o demo **só ativa** com
`NEXT_PUBLIC_LAVAI_DEMO_ENABLED=true` no `.env.local`. **Já está setada.**
A `NEXT_PUBLIC_SUPABASE_URL` no `.env.local` é **real** (`rkub...`), mas o schema
provavelmente não foi aplicado no Supabase (task F0 pendente) — por isso o **demo
é o caminho de teste** atual.

---

## 🧠 Decisões críticas (ADRs no vault: `10 - Projects/LAVAI/06 - Stories and Roadmap/ADRs/`)

1. **ADR-001** — coluna canônica é `user_id` (não `owner_id`). Schema único: `lavai-app/supabase/SETUP_COMPLETO.sql` (idempotente).
2. **ADR-002** — demo mode via flag explícita `NEXT_PUBLIC_LAVAI_DEMO_ENABLED`. **Detecção centralizada em `lib/demo.ts` (`IS_DEMO`).**
3. **ADR-003** — NPS via link HMAC-signed (`lib/nps-signature.ts`).
4. **ADR-004** — webhook Asaas idempotente (tabela `webhook_events`, sempre 200).
5. **ADR-005** — posicionamento "Piloto automático do lava-jato" / H1 "refém".
6. **ADR-006** — PWA premium + hardening v2.

### Regra de ouro aprendida
**A detecção de demo DEVE ser única (`IS_DEMO` de `lib/demo.ts`).** Vários bugs vieram
de cópias divergentes da lógica (fila, NovaOSSheet, /api/me, dashboard). Todas
unificadas. **Se criar algo que precise saber se é demo, importe `IS_DEMO`.**

---

## 🐛 Regressões resolvidas nesta sessão (e como evitar repetir)

| Sintoma | Causa | Lição |
|---------|-------|-------|
| "Design todo zuado" no celular | CSP `upgrade-insecure-requests` forçava HTTPS no acesso HTTP (IP local) | Não usar `upgrade-insecure-requests` em ambiente que serve HTTP |
| "Não abre" no celular | Service Worker v2 (cache-first) servia assets velhos | SW agora é **v3 sem cache** (`public/sw.js`) — só push notifications |
| "Não loga nem demo" | flag demo faltava no build de produção | flag `NEXT_PUBLIC_LAVAI_DEMO_ENABLED=true` no `.env.local` |
| "Dashboard piscando" | loop redirect: dashboard usava lógica antiga de demo → `redirect('/login')` ↔ middleware | unificado com `IS_DEMO` |

---

## 📱 Estado do mobile (commit a11d969)

Feito (validado por `tsc`+`build`, **pendente confirmação visual do usuário no device**):
- FAB único (sem duplicação), posicionado acima das bottom tabs
- Header sem botões mortos (busca/notificações removidos)
- **Fila** e **Clientes**: tabela → cards no mobile (`<lg`), tabela mantida no desktop
- **Agendamentos**: default vista de lista no mobile + header compacto
- Fixes centrais: padding-bottom nas bottom tabs, `100dvh`, `.table-scroll`

---

## ✅ Tasks pendentes

### Dependem do usuário (Gusta)
- **F0** Aplicar `SETUP_COMPLETO.sql` no Supabase real
- **F0** Configurar env vars no Vercel Production + validar deploy
- **F0** Smoke test com dev parceiro
- Criar contas: Upstash (rate limit), Sentry (erros), PostHog (analytics)
- Calcular runway + kill date; validar mensagem "refém" presencial; plan B do WhatsApp bot

### Posso fazer no código (não dependem do usuário)
- **Mobile (continuação):** outras tabelas → cards (financeiro, equipe, fidelidade)
- Implementar busca global + central de notificações reais (foram removidas por serem decorativas)
- Reduzir os ~96 `any` em `app/api`+`lib` (zod gradual)
- Componentes UI base (`<Button>`/`<Input>`/`<Modal>`) — eliminar duplicação
- Reativar PWA offline de forma segura (SW network-first, quando estabilizar)

### Decisões registradas de NÃO-fazer (ver ADR-006)
- `sameSite: strict` + CSRF token (`lax` já mitiga; strict quebra UX)
- App Expo/React Native (pré-PMF não justifica; PWA entrega 90%)

---

## 🗂️ Arquivos-chave

| Arquivo | Para quê |
|---------|----------|
| `lavai-app/lib/demo.ts` | `IS_DEMO` (fonte única) + dados demo + `DEMO_CREDENTIALS` |
| `lavai-app/middleware.ts` | auth guard, rate limit, demo bypass (`getUser`) |
| `lavai-app/lib/api-helpers.ts` | `requireAuth()`, response helpers, rate limit |
| `lavai-app/lib/logger.ts` | logger com PII redaction (email/tel/CPF) |
| `lavai-app/lib/nps-signature.ts` | HMAC sign/verify dos links NPS |
| `lavai-app/lib/fetch-timeout.ts` | timeouts em Asaas/Z-API/Anthropic |
| `lavai-app/supabase/SETUP_COMPLETO.sql` | schema único idempotente |
| `lavai-app/public/sw.js` | service worker v3 (sem cache) |
| `lavai-app/next.config.js` | headers de segurança (CSP sem upgrade-insecure-requests) |
| `lavai-app/components/{Sidebar,Header,BottomTabs}.tsx` | navegação |
| `lavai-app/components/{FAB,NovaOSSheet}.tsx` | **órfãos** (FAB global removido do layout) — podem ser deletados |

---

## ▶️ Primeiro comando sugerido na nova aba

```bash
cd ~/Documents/Claude/Projects/lava-jatis/lavai-app
git log --oneline -3 && npm run build && npm start -- -H 0.0.0.0
```
Depois subir o tunnel e continuar a auditoria visual mobile (validar Fila/Clientes/Agenda/Configurações no device) ou pegar uma task da lista acima.
