# LAVAI — Como Rodar o MVP

## ⚡ Um comando só

```bash
cd lavai-app && bash setup.sh && npm run dev
```

Abre em: **http://localhost:3000**

---

## 📱 Páginas do MVP

| Rota | O que é |
|------|---------|
| `/` | Página inicial com links |
| `/dashboard` | Dashboard completo com fila, métricas, IA, WhatsApp |
| `/fila` | Gestão de fila ao vivo (tabela interativa) |
| `/clientes` | Lista de clientes com perfil lateral |
| `/agendar` | Página pública de agendamento (o cliente acessa este link) |

---

## 🚀 Deploy em 1 minuto (Vercel)

```bash
cd lavai-app
npx vercel
```

Segue as instruções e o site fica no ar em ~60 segundos.

---

## 🛠 Stack

- **Next.js 14** (App Router)
- **TailwindCSS** (dark design premium)
- **Recharts** (gráficos)
- **Lucide React** (ícones)
- **TypeScript** (tipagem completa)
- **Mock data** realista (sem backend ainda — Supabase na fase 2)

---

## 📂 Estrutura

```
lavai-app/
├── app/
│   ├── dashboard/     ← Dashboard principal
│   ├── fila/          ← Fila ao vivo
│   ├── clientes/      ← Gestão de clientes
│   └── agendar/       ← Booking público
├── components/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── dashboard/     ← MetricsRow, QueuePanel, RevenueChart, AIInsight
├── lib/
│   ├── mock-data.ts   ← Dados realistas para demo
│   └── utils.ts
└── types/index.ts
```
