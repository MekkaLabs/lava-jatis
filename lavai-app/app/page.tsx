import Link from 'next/link'
import {
  Zap,
  ArrowRight,
  MessageCircle,
  Clock,
  Star,
  BarChart2,
  Calendar,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export const metadata = {
  title: 'LAVAI — O piloto automático do seu lava-jato',
  description:
    'Você é dono de lava-jato ou refém dele? O LAVAI cuida da fila, do WhatsApp e dos clientes enquanto você cuida do que importa.',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen text-white" style={{ background: '#08090f' }}>
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30"
        style={{ background: 'rgba(8,9,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              <Zap size={15} color="#000" strokeWidth={3} />
            </div>
            <span className="font-bold text-lg tracking-tight"
              style={{ background: 'linear-gradient(90deg,#00d4ff,#4f8eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LAVAI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="px-4 py-2 text-sm font-semibold text-black rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-5 pt-16 pb-20 lg:pt-24 lg:pb-28"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 60%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', color: '#00d4ff' }}>
            <Sparkles size={12} /> Em beta — vagas limitadas para os primeiros 50
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-[1.05]"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
            Você é dono de lava-jato
            <br />
            <span style={{ background: 'linear-gradient(90deg,#00d4ff,#4f8eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ou refém dele?
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-9 leading-relaxed">
            O LAVAI é o <strong className="text-white">piloto automático</strong> que cuida da fila, do
            WhatsApp e dos clientes enquanto você cuida do que importa.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link href="/cadastro"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-black text-base transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
              Começar grátis
              <ArrowRight size={17} />
            </Link>
            <Link href="/agendar?lj=demo"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white text-base transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Ver demo
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-5">
            14 dias grátis · sem cartão · cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── Não é mais um ERP ────────────────────────────────────────────── */}
      <section className="px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
            O que muda no seu dia
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
            Por que não é só mais um sistema
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: MessageCircle, title: 'Funciona pelo WhatsApp', desc: 'Seu cliente já usa. Sua equipe já usa. Sem curva de aprendizado.' },
              { icon: CheckCircle2, title: 'Setup feito por nós', desc: 'Você não configura nada. A gente liga e deixa funcionando em 48h.' },
              { icon: Clock, title: 'Sem fidelização', desc: 'Pagamento mensal. Cancela quando quiser. Sem multa.' },
            ].map((b, i) => {
              const Icon = b.icon
              return (
                <div key={i} className="p-6 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon size={26} className="text-cyan-400 mb-3" />
                  <h3 className="font-bold text-white mb-1.5">{b.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Feature âncora: WhatsApp Bot ──────────────────────────────────── */}
      <section className="px-5 py-20"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 70%)' }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: '#00e676' }}>
              <MessageCircle size={12} /> O coração do automático
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight"
              style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              Um robô atendendo seu WhatsApp.
              <br />
              <span className="text-gray-400">24 horas. Todo dia.</span>
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Enquanto você dorme, o LAVAI responde dúvidas, marca horários, avisa quando o
              carro fica pronto e pede avaliação. Tudo no WhatsApp do seu cliente.
            </p>
            <ul className="space-y-3">
              {[
                'Cliente marca horário pelo WhatsApp sozinho',
                'Avisa automático quando o carro fica pronto',
                'Pede avaliação após cada lavagem (NPS)',
                'Reativa cliente que sumiu há mais de 30 dias',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* WhatsApp mockup */}
          <div className="rounded-3xl p-5 sm:p-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>🤖</div>
              <div>
                <p className="font-bold text-white text-sm">Lava-Jato do João</p>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  online
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-sm text-sm"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                Oi! Quero marcar uma lavagem completa amanhã 👋
              </div>
              <div className="max-w-[80%] ml-auto p-3 rounded-2xl rounded-tr-sm text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)', color: '#000' }}>
                Claro! Temos esses horários:<br/>9:00 · 10:30 · 14:00
              </div>
              <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-sm text-sm"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                10:30 pra mim 👍
              </div>
              <div className="max-w-[80%] ml-auto p-3 rounded-2xl rounded-tr-sm text-sm"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)', color: '#000' }}>
                Marcado! ✅ Te aviso quando ficar pronto.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Outras features (subordinadas) ────────────────────────────────── */}
      <section className="px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
            Tudo o que você precisa, automático.
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Com o LAVAI, sua operação roda no piloto automático — e você pode focar em crescer.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Clock,      title: 'Fila em tempo real',   desc: 'Veja todo carro no pátio, em qual etapa está, e quanto tempo falta.' },
              { icon: Users,      title: 'CRM de clientes',       desc: 'Histórico, ticket médio, frequência e classificação por fidelidade.' },
              { icon: Calendar,   title: 'Agendamento público',   desc: 'Link único que clientes usam pra marcar horário sem você atender.' },
              { icon: Star,       title: 'Fidelidade automática', desc: 'Pontos por R$ gastos, níveis Bronze→Diamante, recompensas e resgates.' },
              { icon: BarChart2,  title: 'Relatórios e financeiro',desc: 'Receita, despesas, ticket médio, top serviços, exportação PDF.' },
              { icon: Sparkles,   title: 'Insights com IA',       desc: 'Claude analisa seus números e sugere onde melhorar a operação.' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="p-5 rounded-2xl transition-all hover:bg-white/[0.05]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Icon size={22} className="text-cyan-400 mb-3" />
                  <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="px-5 py-20" id="precos"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(79,142,255,0.05) 0%, transparent 70%)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
            Planos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
            Comece pequeno. Cresça sem fricção.
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            14 dias grátis em qualquer plano. Sem cartão pra começar.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {/* Básico */}
            <div className="p-6 rounded-2xl flex flex-col"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Básico</p>
              <div className="mb-1">
                <span className="text-4xl font-black text-white">R$97</span>
                <span className="text-sm text-gray-500">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-5">1 unidade · 3 funcionários</p>
              <ul className="space-y-2 text-sm text-gray-300 mb-6 flex-1">
                {['Fila em tempo real', 'CRM de clientes', 'Agendamento público', 'Relatórios mensais'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
                ))}
              </ul>
              <Link href="/cadastro" className="block w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Começar grátis
              </Link>
            </div>

            {/* Profissional — destacado */}
            <div className="p-6 rounded-2xl flex flex-col relative"
              style={{ background: 'linear-gradient(180deg, rgba(0,212,255,0.08), rgba(79,142,255,0.04))', border: '1.5px solid rgba(0,212,255,0.4)' }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-black"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
                Mais popular
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Profissional</p>
              <div className="mb-1">
                <span className="text-4xl font-black text-white">R$197</span>
                <span className="text-sm text-gray-500">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-5">3 unidades · funcionários ilimitados</p>
              <ul className="space-y-2 text-sm text-gray-300 mb-6 flex-1">
                {[
                  'Tudo do Básico',
                  'WhatsApp Bot 24/7',
                  'Fidelidade automática',
                  'NPS via WhatsApp',
                  'Insights com IA',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
                ))}
              </ul>
              <Link href="/cadastro?plano=pro" className="block w-full py-2.5 rounded-xl text-center text-sm font-bold text-black transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
                Começar 14 dias grátis
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl flex flex-col"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Enterprise</p>
              <div className="mb-1">
                <span className="text-4xl font-black text-white">R$599</span>
                <span className="text-sm text-gray-500">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mb-5">Unidades ilimitadas · suporte dedicado</p>
              <ul className="space-y-2 text-sm text-gray-300 mb-6 flex-1">
                {[
                  'Tudo do Profissional',
                  'Multi-unidade ilimitado',
                  'API para integrações',
                  'Suporte por telefone',
                  'Treinamento on-site',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> <span>{f}</span></li>
                ))}
              </ul>
              <Link href="/cadastro?plano=enterprise" className="block w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Falar com vendas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="px-5 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
            Pare de ser refém da sua operação.
          </h2>
          <p className="text-gray-400 mb-8">
            Em 5 minutos seu lava-jato está no automático. Sem cartão. Sem fidelização.
          </p>
          <Link href="/cadastro"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-black text-base transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}>
            Quero ver funcionando
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="px-5 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              <Zap size={13} color="#000" strokeWidth={3} />
            </div>
            <span className="text-sm text-gray-400">LAVAI © {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 justify-center sm:justify-end">
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/cadastro" className="hover:text-white transition-colors">Cadastro</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/lgpd/excluir" className="hover:text-white transition-colors">Excluir meus dados</Link>
            <a href="mailto:contato@lavai.com.br" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
