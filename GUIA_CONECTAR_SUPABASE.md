# LAVAI — Guia de Conexão com Supabase Real

> Passo-a-passo pra sair do **modo demo** e usar **dados reais** (cadastros persistem,
> agendamentos salvam, equipe salva). Mesmo guia resolve os bugs reportados em
> "agendamentos não salvam" (AJ4) e "equipe não salva" (AJ6) — eles eram limitação
> do demo, não bug de código.

---

## Pré-requisitos
- Conta no Supabase (https://supabase.com) — gratuita
- Acesso ao Vercel Dashboard do projeto LAVAI
- Email seu (`gustav0.v1c3nt3@gmail.com` é o que aparece no super-admin)

---

## Passo 1 — Aplicar o schema no Supabase

1. Abra o seu projeto no **Supabase Dashboard**.
2. Vá em **SQL Editor** (ícone `</>` na barra lateral).
3. **New query** → cole **todo** o conteúdo de `lavai-app/supabase/SETUP_COMPLETO.sql`.
4. Clique em **Run** (canto inferior direito).

✅ **O script é idempotente** — pode rodar quantas vezes quiser sem quebrar.
Cria 17 tabelas + RLS + índices + função `admin_list_lava_jatos`.

**Confirme:** vá em **Table Editor** → todas as tabelas devem aparecer com
escudo verde (RLS ativo).

---

## Passo 2 — Promover seu user pra super-admin

Depois que pelo menos 1 usuário tiver feito cadastro (qualquer um, inclusive você),
rode no **SQL Editor**:

```sql
INSERT INTO super_admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'gustav0.v1c3nt3@gmail.com';
```

> Substitua pelo seu email se for outro. Você poderá acessar `/admin` no app
> e ver todos os lava-jatos cadastrados + planos.

---

## Passo 3 — Pegar as credenciais do Supabase

No Supabase: **Project Settings → API**.

| Variável | Onde fica |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (ex `https://rkub...supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → `service_role` (⚠️ **secret**, nunca commitar) |

---

## Passo 4 — Configurar env vars no Vercel

No **Vercel Dashboard** do projeto LAVAI:
**Settings → Environment Variables**.

Adicione (todas em **Production**):

| Nome | Valor | Notas |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | (do passo 3) | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (do passo 3) | |
| `SUPABASE_SERVICE_ROLE_KEY` | (do passo 3) | **Production apenas — nunca em Preview** |
| `NEXT_PUBLIC_APP_URL` | `https://lavai.com.br` (ou o domínio Vercel) | |
| `NPS_HMAC_SECRET` | `openssl rand -hex 32` no terminal | gera 64 chars hex |
| `NEXT_PUBLIC_LAVAI_DEMO_ENABLED` | `false` | ⚠️ **MUITO IMPORTANTE** — em prod precisa estar **false** |

Opcionais (features ativam só quando setadas):
- `ASAAS_API_KEY` + `ASAAS_ENV=production` + `ASAAS_WEBHOOK_TOKEN` (pagamentos)
- `RESEND_API_KEY` + `FROM_EMAIL=no-reply@seu-dominio.com` (emails)
- `ANTHROPIC_API_KEY` (insights IA)
- `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` + `ZAPI_CLIENT_TOKEN` (WhatsApp bot)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (push) — gerar com `npx web-push generate-vapid-keys`

Após salvar tudo: **Deployments** → último deploy → **`...` → Redeploy** (pra
pegar as env vars novas).

---

## Passo 5 — Desativar demo localmente também (opcional)

No `.env.local` (no seu Mac):

```
NEXT_PUBLIC_LAVAI_DEMO_ENABLED=false
```

E rebuilda local:
```bash
cd ~/Documents/Claude/Projects/lava-jatis/lavai-app
npm run build && npm start -- -H 0.0.0.0
```

---

## Passo 6 — Cadastrar o primeiro lava-jato

Com o app em modo real (não demo):

1. Abra `/cadastro` na URL do Vercel (ou local)
2. Preencha: nome, email, senha, nome do lava-jato, cidade, WhatsApp
3. Submeta → cria o user no Supabase Auth + insere em `lava_jatos` + serviços padrão

✅ **A partir daí, TUDO PERSISTE.** Agendamentos salvam, equipe salva,
clientes salvam. Sai do demo, é dado real.

---

## Passo 7 — Acessar o super-admin

1. Após rodar o `INSERT INTO super_admins` (passo 2), acesse `/admin`.
2. Verá:
   - Total de lava-jatos
   - Quantos ativos / trial / inadimplentes
   - MRR estimado
   - Lista completa com plano de cada um

---

## Solução de problemas

| Sintoma | Causa | Fix |
|---------|-------|-----|
| `/admin` retorna 403 "Acesso restrito" | Seu user_id não está em `super_admins` | Roda o INSERT do passo 2 |
| Login no Vercel falha "Email ou senha incorretos" | Schema não aplicado OU usuário ainda não cadastrado | Aplica SETUP_COMPLETO.sql (passo 1), depois cadastra no `/cadastro` |
| Demo ainda aparece em produção | Esqueceu de setar `NEXT_PUBLIC_LAVAI_DEMO_ENABLED=false` | Passo 4 — Vercel env vars |
| Agendamento ainda não salva | Provavelmente ainda em demo OU NOT NULL violado | Verifique env vars + abra Vercel Logs |
| RLS error "new row violates ..." | Schema desatualizado (ainda tem `owner_id`) | Re-roda SETUP_COMPLETO.sql (a Section 1 migra automaticamente) |

---

## ✅ Checklist final

- [ ] SETUP_COMPLETO.sql aplicado no Supabase Dashboard
- [ ] super_admin promovido via SQL
- [ ] Env vars no Vercel (todas as mínimas do passo 4)
- [ ] `NEXT_PUBLIC_LAVAI_DEMO_ENABLED=false` em produção
- [ ] Redeploy disparado
- [ ] Cadastrei o 1º lava-jato real
- [ ] Acessei `/admin` e vi a lista
- [ ] Testei: criei OS, criou agendamento, adicionou funcionário → tudo persiste após F5
