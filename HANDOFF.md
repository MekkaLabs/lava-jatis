# LAVAI — Handoff de Sessão (atualizado 2026-05-28)

> Documento de continuação. Leia junto com `CLAUDE.md` (contexto do produto),
> `GUIA_CONECTAR_SUPABASE.md` e `VERCEL_ENV_SETUP.md`.
> Vault de conhecimento: `~/Documents/lavai-obsidian/`.

---

## 🚦 Como continuar nesta nova aba

1. Ler `CLAUDE.md` — produto, stack, estrutura, padrões
2. Ler este `HANDOFF.md` — estado atual + aprendizados
3. Abrir o vault Obsidian → `LLM-CONNECT.md` + daily mais recente
4. Tasks: 73 de 79 completas (ver seção "Tasks pendentes")

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

## ✅ Tasks pendentes (6 de 79)

### Bugs ainda abertos (eu consigo fazer)
- _(nenhum P0 de persistência aberto — #70/#53/#55 concluídos)_

### ✅ Concluídas nesta sessão
- **#70** `/clientes` GET real — **FEITO**. `useEffect` que pagina `GET /api/clientes` ao montar
  (não-demo) + `rowToCustomer()` com agregados reais. Corrigido bug correlato: rotas de clientes
  referenciavam coluna **`cpf` inexistente** (GET 500 / POST falha) → removido. `cor` faltava no
  `SETUP_COMPLETO.sql` → adicionada (DB já tinha).
- **#55** `/equipe` persistir — **JÁ ESTAVA FEITO**. Página já faz GET/POST/PATCH/DELETE reais via
  `/api/funcionarios`; route usa só colunas reais (nome, cargo, telefone, salario). Sem mudança
  necessária — apenas verificado.
- **#53** `/agendamentos` persistir — **FEITO**. Reescrita completa:
  - Página busca `GET /api/atendimentos?from=&to=` da semana visível e mapeia via
    `atendimentoToAgendamento()`; refaz fetch ao trocar de semana e após salvar. WipBanner removido.
  - Modal carrega **serviços/clientes/funcionários reais** (autocomplete de cliente) e faz
    **POST real** em `/api/atendimentos` com `dataHora` (datetime local → ISO no servidor).
  - **Fix crítico no POST `/api/atendimentos`** (estava QUEBRADO em produção — afetava Fila também):
    a tabela exige `servico_nome`, `preco`, `placa` NOT NULL, mas o POST não setava `servico_nome`
    nem `preco` e podia inserir `placa` nula → toda criação de OS daria 500. Agora resolve
    nome+preço do serviço, seta os 3 campos, e aceita `dataHora`/`funcionario`.
  - GET `/api/atendimentos` agora retorna `data_hora`/`funcionario` e aceita filtro `from`/`to`.
- **Onboarding conectado** — **JÁ ESTAVA FEITO** (verificado): `/cadastro` → `/api/cadastro` cria
  user Supabase (service role, email confirmado) + insere `lava_jatos` + seed de `SERVICOS_DEFAULTS`
  (rollback do user se o lava_jato falhar) → login automático → `/dashboard`. Schema de `servicos`
  conferido (insert usa `duracao_minutos`, existe). **Melhoria feita:** `/cadastro` agora é
  **Turnstile-ready** — novo `components/TurnstileWidget.tsx` renderiza o captcha quando
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está setada e envia `turnstileToken` (single-use, reset em falha).
  Antes, ligar o `TURNSTILE_SECRET_KEY` em prod **quebraria o signup** (page nunca mandava token →
  403). Sem key → widget não aparece, fluxo segue como hoje (backend no-op). CSP já libera
  `challenges.cloudflare.com`.

- **Relatório de funcionário** — **FEITO**. Vertical completo:
  - `GET /api/funcionarios/relatorio?from=&to=` agrega OS concluídas por `funcionario` (texto):
    nº OS, faturamento, ticket médio + totais. "Não atribuído" para OS sem funcionário.
  - `NovaOSSheet` (Fila) agora tem seletor de **funcionário** → OS passam a ser atribuíveis
    (antes só o agendamento atribuía; Fila não setava → relatório ficaria vazio).
  - `/equipe`: seção "Relatório de Produtividade" com filtro de período (mês/30d/tudo) e
    campo de **comissão %** (cálculo client-side sobre faturamento). Demo tem dataset representativo.

⚠️ **Validação end-to-end no browser pendente** (clientes/agendamentos): tabelas `clientes` e
`atendimentos` estão **VAZIAS em todos os tenants** e o teste autenticado exige login real do
Supabase (demo está off). tsc + build passam (exit 0) e o shape dos INSERTs foi conferido contra
o schema real. Teste sugerido logado: criar cliente → criar OS na Fila → criar agendamento → F5.

### Dependem do Gusta
- **#17/18/19** Env vars no Vercel + deploy + smoke test (ver `VERCEL_ENV_SETUP.md`)
- **#23** Runway + kill date · **#24** validar "refém" presencial · **#27** plan B WhatsApp bot
- **#26** Sentry (free tier) — Cyber Chief recomendou reativar antes do go-live

### Registro pendente
- **#79** Salvar os 6 relatórios de agentes AIOS no vault (`03 - Agents/*-2026-05-28.md`)

---

## 🔒 Backlog de segurança (Cyber Chief)

1. ✅ **FEITO** — escape do JSON-LD (`<` → `<`) no `layout.tsx`. Defesa XSS / future-proof.
2. ✅ **FEITO** — Origin/Referer check no middleware p/ métodos mutantes em `/api/*`
   (CSRF defense-in-depth). Webhooks (`/api/payments/webhook`, `/api/whatsapp/webhook`) isentos;
   server-to-server sem Origin/Referer é permitido (CSRF exige browser).
6. 🟡 **PARCIAL** — MFA TOTP: enrollment opt-in feito em `/configuracoes → Segurança`
   (`SegurancaTab`): enroll → QR → verify (`supabase.auth.mfa.*`) + desativar. **Falta enforcement
   no login** (desafio AAL2 em `app/login`) — deixado de fora de propósito (risco de lockout +
   precisa teste logado). Hoje: ativar 2FA registra o fator mas login entra em AAL1 sem pedir código.
   **Follow-up:** após login → `getAuthenticatorAssuranceLevel()`; se `nextLevel==='aal2'` pedir TOTP
   (challenge+verify). Implementar+testar JUNTO com o deploy logado. Recuperação se travar: remover
   o fator via Supabase Dashboard (service role).

3. ⏳ Tabela `admin_audit_log` + INSERT na RPC admin — **adiado**: route admin é read-only hoje
   (só `admin_list_lava_jatos`), valor baixo até existir mutação admin. Exige migration na DB.
4. ⏳ Reduzir JWT expiry pra 3600s no Supabase Dashboard — **depende do Gusta** (dashboard).
5. ⏳ CSP nonce-based (mata `unsafe-inline`/`unsafe-eval` em script-src) — ~1 dia, risco alto
   (GA + SW + Next runtime). CSP base já é forte (object-src none, base-uri self, frame-ancestors
   none, HSTS, COOP/CORP) no `next.config.js`.
6. ⏳ TOTP MFA pros super-admins (Supabase Auth built-in) — maior, envolve UI de enrollment.

### ✨ Melhoria correlata feita nesta sessão
- `/clientes` → `ClienteDetail` agora busca **histórico real** via `GET /api/clientes/[id]`
  (mock só no demo). Antes mostrava 5 OS falsas mesmo em produção ("teatro"). Loading + empty state.

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

**Pendência aberta pra retomar:** #70, #53 e #55 concluídas. Não há mais P0 de persistência.
Restam tarefas que dependem do Gusta (env vars Vercel, deploy, Asaas/Resend/Z-API) e backlog de
segurança. Próximo passo recomendado: **validação end-to-end logado** + deploy.

**Commit pendente (rodar no terminal do Gusta):**
```bash
cd ~/Documents/Claude/Projects/lava-jatis
rm -f .git/HEAD.lock .git/index.lock
git add .
git commit -m "fix: persistência real /clientes, /agendamentos + POST atendimentos (servico_nome/preco NOT NULL) [#70 #53 #55]"
git push origin main
```
