# Deploy LAVAI em Produção

## Opção 1 — Vercel (Recomendado)

### Pré-requisitos
- Conta na [Vercel](https://vercel.com) (grátis)
- Node.js 18+ instalado
- Git

### Passo a passo

**1. Instalar Vercel CLI**
```bash
npm install -g vercel
```

**2. Fazer login**
```bash
vercel login
```

**3. Acessar a pasta do app**
```bash
cd lavai-app
```

**4. Configurar variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite .env.local com seus valores reais
```

**5. Deploy**
```bash
vercel --prod
```

A Vercel vai perguntar algumas coisas na primeira vez — aceite os defaults para Next.js.

### URL gerada
Após o deploy, a Vercel fornece uma URL do tipo:
`https://lavai-app-xxxxx.vercel.app`

---

## Opção 2 — Script automático (macOS)

Clique duas vezes no arquivo `DEPLOY_VERCEL.command` na raiz do projeto.

---

## Variáveis de ambiente na Vercel

No painel da Vercel: **Settings → Environment Variables**

Adicione as mesmas variáveis do `.env.local`.

---

## Domínio personalizado

No painel da Vercel: **Settings → Domains**

Adicione `app.lavai.com.br` ou o domínio que preferir.

---

## Próximos passos após o deploy

- [ ] Configurar banco de dados (Supabase recomendado)
- [ ] Ativar autenticação (NextAuth ou Clerk)
- [ ] Conectar WhatsApp Business API
- [ ] Configurar domínio personalizado
