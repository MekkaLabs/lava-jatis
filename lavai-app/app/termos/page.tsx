import Link from 'next/link'
import { Zap, FileText } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso — LAVAI',
  description: 'Termos e condições de uso da plataforma LAVAI.',
}

export default function TermosPage() {
  return (
    <main className="min-h-screen text-white" style={{ background: '#08090f' }}>
      <nav className="sticky top-0 z-30"
        style={{ background: 'rgba(8,9,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#4f8eff)' }}>
              <Zap size={15} color="#000" strokeWidth={3} />
            </div>
            <span className="font-bold text-lg"
              style={{ background: 'linear-gradient(90deg,#00d4ff,#4f8eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LAVAI
            </span>
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
          <FileText size={14} /> Termos de Uso
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2"
          style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
          Regras claras pra usar o LAVAI
        </h1>
        <p className="text-sm text-gray-500 mb-10">Última atualização: 19 de maio de 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Aceitação</h2>
            <p>Ao criar uma conta ou usar qualquer parte da plataforma LAVAI, você concorda com estes Termos de Uso e com a <Link href="/privacidade" className="text-cyan-400 hover:underline">Política de Privacidade</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. O serviço</h2>
            <p>O LAVAI é um software como serviço (SaaS) que oferece gestão operacional para lava-jatos: fila em tempo real, CRM, agendamento, fidelidade, NPS, relatórios e integração com WhatsApp. Reservamos o direito de evoluir as funcionalidades, sempre comunicando mudanças relevantes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Conta e responsabilidades</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Você é responsável pela veracidade dos dados cadastrais e por manter sua senha em segurança.</li>
              <li>O LAVAI deve ser usado apenas para finalidade legítima de gestão de lava-jato.</li>
              <li>É proibido tentar acessar contas de terceiros, fazer engenharia reversa ou abuso da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Planos e pagamento</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Planos: <strong className="text-white">Básico R$97/mês</strong>, <strong className="text-white">Profissional R$197/mês</strong>, <strong className="text-white">Enterprise R$599/mês</strong></li>
              <li>14 dias grátis ao cadastrar — sem cartão de crédito.</li>
              <li>Cobrança mensal automática via Asaas (PIX, cartão ou boleto).</li>
              <li>Cancelamento a qualquer momento — sem multa, sem fidelização.</li>
              <li>Em caso de inadimplência, o acesso pode ser suspenso após 14 dias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Dados dos clientes finais</h2>
            <p>Você é controlador dos dados dos seus clientes (nome, telefone, placa). O LAVAI é operador desses dados, conforme art. 5 da LGPD. Você deve obter consentimento dos seus clientes para uso do agendamento público e do NPS via WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Propriedade intelectual</h2>
            <p>Todo conteúdo, código, design e marca do LAVAI são propriedade exclusiva. É proibido copiar, modificar ou redistribuir sem autorização.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Limitação de responsabilidade</h2>
            <p>O LAVAI envidará esforços razoáveis para manter o serviço disponível e seguro, mas não garante 100% de uptime. Não nos responsabilizamos por: indisponibilidade de fornecedores externos (Z-API, Asaas, Supabase, Vercel), perda de dados decorrente de mau uso ou ação do usuário, lucros cessantes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Suspensão e encerramento</h2>
            <p>Podemos suspender ou encerrar sua conta em caso de violação destes termos, uso fraudulento ou ordem judicial. Você pode encerrar sua conta a qualquer momento por <a href="mailto:contato@lavai.com.br" className="text-cyan-400 hover:underline">contato@lavai.com.br</a> ou pela tela de configurações.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Mudanças nos termos</h2>
            <p>Estes termos podem ser atualizados. Mudanças relevantes serão notificadas com 30 dias de antecedência. Continuar usando o serviço após a notificação implica aceite dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Foro</h2>
            <p>Estes termos são regidos pelas leis brasileiras. Fica eleito o foro do domicílio do consumidor para dirimir controvérsias.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between text-sm">
          <Link href="/privacidade" className="text-cyan-400 hover:underline">← Política de Privacidade</Link>
          <Link href="/" className="text-gray-400 hover:text-white">Voltar ao início →</Link>
        </div>
      </article>
    </main>
  )
}
