# Vercel — Setup das Env Vars para Produção

> Aplicado em **2026-05-26**. Schema Supabase **já está no ar** (projeto `lavai`,
> ref `rkubeyoxgojbtwqrrwmn`). Falta só configurar o Vercel pra que o deploy
> em `main` use o banco real.

---

## ⚠️ Crítico: o que muda entre Preview e Production

| Variável | Preview/Dev | Production | Por quê |
|----------|-------------|------------|---------|
| `NEXT_PUBLIC_LAVAI_DEMO_ENABLED` | `false` (ou ausente) | **`false`** | Demo em prod = backdoor (admin/Am0cmph3@) |
| `SUPABASE_SERVICE_ROLE_KEY` | **NÃO setar** | setar | Bypassa RLS — só prod confia |
| `NPS_HMAC_SECRET` | qualquer 32+ chars | **secret real** | HMAC dos links NPS |

---

## Passos no Vercel Dashboard

**Project → Settings → Environment Variables → Add new**

### 🔴 Obrigatórias (Production scope)

| Nome | Valor | Onde achar |
|------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rkubeyoxgojbtwqrrwmn.supabase.co` | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (do `.env.local`) | Supabase Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | (do `.env.local`) | Supabase Settings → API → service_role secret. **⚠️ Production scope APENAS — não setar em Preview** |
| `NPS_HMAC_SECRET` | (do `.env.local` local) | Já gerado no seu Mac. Copia o valor de lá. |
| `NEXT_PUBLIC_APP_URL` | `https://lavai.com.br` (ou URL Vercel) | Você decide |
| `NEXT_PUBLIC_LAVAI_DEMO_ENABLED` | `false` | Pra **garantir** que demo não ativa em prod |

### 🟡 Opcionais (ativam features quando setadas)

| Nome | Quando setar |
|------|--------------|
| `ASAAS_API_KEY` + `ASAAS_ENV=production` + `ASAAS_WEBHOOK_TOKEN` | Quando ativar cobrança real |
| `RESEND_API_KEY` + `FROM_EMAIL=no-reply@lavai.com.br` | Emails (welcome, NPS, semanal) |
| `ANTHROPIC_API_KEY` | Insights IA — sem isso, mocks |
| `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` + `ZAPI_CLIENT_TOKEN` | WhatsApp bot |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | Push notifications |

### Como copiar valores do .env.local pro Vercel

```bash
cd ~/Documents/Claude/Projects/lava-jatis/lavai-app
# Mostra a chave service-role mascarada nas 8 últimas chars pra você verificar
grep -E "^SUPABASE_SERVICE_ROLE_KEY|^NPS_HMAC_SECRET|^NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local
```

Não compartilhe esses valores fora do Vercel (não cole em chat, repo, etc).

---

## Depois de salvar tudo

1. **Trigger redeploy:** Deployments → último deploy → `...` → **Redeploy** (com clear cache: NÃO).
2. **Smoke test no domínio do Vercel:**
   ```bash
   curl -I https://SEU-PROJETO.vercel.app/login
   # Esperado: HTTP/2 200
   curl -I https://SEU-PROJETO.vercel.app/admin
   # Esperado: HTTP/2 307 (redirect /login)
   ```
3. **Login real:**
   - Use sua conta `gustav0.v1c3nt3@gmail.com` (já está no Supabase Auth)
   - Senha: a que você usou ao se cadastrar
   - Vai redirecionar pro `/dashboard` com seus 2 lava-jatos cadastrados
4. **Teste `/admin`:**
   - Acesse `/admin` — deve mostrar a lista de lava-jatos (já te promovi a super-admin no banco)

---

## ⚠️ Ainda falta — config manual no Supabase

**Habilitar Leaked Password Protection** (advisor remanescente):

1. Supabase Dashboard → Authentication → Policies
2. Procure "Leaked Password Protection"
3. Toggle: **Enabled**

Isso checa senhas contra HaveIBeenPwned ao cadastrar/trocar — bloqueia se a senha já vazou em algum data breach. Recomendado pra qualquer prod.

---

## Estado atual do banco

✅ 19 tabelas, todas com RLS
✅ Super-admin promovido: `gustav0.v1c3nt3@gmail.com`
✅ 2 lava-jatos + 7 serviços preservados do cadastro anterior
✅ Function `admin_list_lava_jatos()` com `search_path` pinned + REVOKE PUBLIC/anon
✅ NPS sem policies abertas (passa só via service role após HMAC)
✅ Webhook idempotency + LGPD tables prontos

---

## Quando algo falhar

| Sintoma | Provável causa | Fix |
|---------|----------------|-----|
| `/login` → 502 no Vercel | Env vars Supabase ausentes ou inválidas | Re-verifica nomes (sem espaços, exatos) |
| Login: "Email ou senha incorretos" | Senha errada **ou** schema não aplicado | Senha primeiro; depois `select count(*) from public.lava_jatos` no SQL Editor |
| `/admin` retorna 403 | user_id não está em `super_admins` | Já promovi pelo MCP — confirme `select * from super_admins` |
| Demo ainda aparece em prod | `NEXT_PUBLIC_LAVAI_DEMO_ENABLED=true` no Vercel | Mude pra `false` + Redeploy |
| Webhook Asaas retorna 500 | `SUPABASE_SERVICE_ROLE_KEY` faltando | Setar em **Production** apenas |
| Cadastro retorna 403 "anti-bot" | `TURNSTILE_SECRET_KEY` setada mas `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ausente | Setar **as duas** ou **nenhuma** (ver abaixo) |
| POST de integração externa → 403 "Origin not allowed" | Origin check do middleware (CSRF) | Esperado p/ cross-origin. Webhooks (`/api/payments/webhook`, `/api/whatsapp/webhook`) são isentos |

---

## 🔄 Atualizações 2026-06-02 (nova sessão)

### Turnstile — regra de pareamento (IMPORTANTE)
O `/cadastro` agora renderiza o captcha Cloudflare e envia o token. As duas chaves andam **juntas**:

| Cenário | Resultado |
|---------|-----------|
| Nenhuma setada | ✅ Signup normal, sem captcha (backend no-op) — **estado atual, ok** |
| **Ambas** setadas | ✅ Captcha ativo e validado |
| Só `TURNSTILE_SECRET_KEY` | ❌ **Signup quebra** (page não manda token → 403). NÃO faça isso |
| Só `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ⚠️ Widget aparece mas backend não valida (inútil) |

Regra: **set as duas ou nenhuma**. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` precisa do scope que o build enxerga (Production + Preview).

### Smoke test expandido (features novas desta sessão)
Logado no domínio de produção:
1. **/clientes** → "Novo Cliente" → salvar → **F5** → cliente persiste na lista (task #70)
2. **/fila** → "Nova OS" → escolher serviço + **funcionário** → criar
3. **/equipe** → seção "Relatório de Produtividade" → a OS acima aparece no funcionário (concluir a OS primeiro p/ contar faturamento)
4. **/agendamentos** → "+" → cliente + serviço + data/hora → Agendar → **F5** → persiste (task #53)
5. **/clientes** → abrir um cliente → "Histórico de Atendimentos" mostra OS **reais** (não mock)
6. **/configuracoes → Segurança** → "Ativar 2FA" → escanear QR → digitar código → ativa
   (login enforcement do 2FA ainda é follow-up — ver HANDOFF backlog #6)

### SQL — nada novo obrigatório
`SETUP_COMPLETO.sql` ganhou `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cor` (idempotente; a DB
real já tinha a coluna). Não precisa rodar nada — mas se rodar de novo, é seguro.
