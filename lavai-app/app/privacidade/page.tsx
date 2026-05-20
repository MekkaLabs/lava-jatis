import Link from 'next/link'
import { Zap, Shield, Mail } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade — LAVAI',
  description: 'Como o LAVAI coleta, usa e protege seus dados pessoais. Conforme LGPD.',
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen text-white" style={{ background: '#08090f' }}>
      {/* Nav */}
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
          <Shield size={14} /> Política de Privacidade
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2"
          style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
          Como protegemos seus dados
        </h1>
        <p className="text-sm text-gray-500 mb-10">Última atualização: 19 de maio de 2026</p>

        <div className="prose-invert space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Quem somos</h2>
            <p>
              O LAVAI é um sistema brasileiro de gestão para lava-jatos. Esta política descreve como
              coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a
              Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Dados que coletamos</h2>
            <p className="mb-2">Coletamos os seguintes tipos de dados:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Donos de lava-jato (usuários da plataforma):</strong> nome, email, telefone, nome e endereço do lava-jato, dados de pagamento (processados pela Asaas).</li>
              <li><strong className="text-white">Clientes finais (atendidos pelo lava-jato):</strong> nome, telefone, placa do veículo, modelo (apenas com consentimento explícito).</li>
              <li><strong className="text-white">Dados técnicos:</strong> endereço IP, tipo de navegador, páginas visitadas (para segurança e melhoria do serviço).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Por que usamos seus dados</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Operar o sistema (gerenciar fila, agendamentos, financeiro do lava-jato)</li>
              <li>Enviar avaliação de serviço (NPS) via WhatsApp após cada atendimento</li>
              <li>Processar pagamentos e emitir comprovantes</li>
              <li>Notificar sobre status do agendamento ou pagamento</li>
              <li>Cumprir obrigações legais (fiscais, contábeis)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Base legal (LGPD Art. 7)</h2>
            <p>Tratamos seus dados com base em: (a) consentimento explícito do titular; (b) execução de contrato ou procedimentos preliminares; (c) cumprimento de obrigação legal; (d) legítimo interesse, sempre balanceado com seus direitos.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Com quem compartilhamos</h2>
            <p className="mb-2">Compartilhamos dados apenas com fornecedores essenciais à operação:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Supabase</strong> (banco de dados — EUA, com cláusulas-padrão de transferência internacional)</li>
              <li><strong className="text-white">Vercel</strong> (hospedagem)</li>
              <li><strong className="text-white">Asaas</strong> (processamento de pagamentos no Brasil)</li>
              <li><strong className="text-white">Resend</strong> (envio de emails transacionais)</li>
              <li><strong className="text-white">Z-API</strong> (integração WhatsApp para notificações)</li>
              <li><strong className="text-white">Anthropic</strong> (insights de IA — sem envio de dados identificáveis de clientes finais)</li>
            </ul>
            <p className="mt-2 text-sm text-gray-400">Nunca vendemos dados a terceiros para marketing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Seus direitos (LGPD Art. 18)</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Confirmação e acesso:</strong> saber se tratamos seus dados e quais</li>
              <li><strong className="text-white">Correção:</strong> atualizar dados incompletos ou desatualizados</li>
              <li><strong className="text-white">Anonimização ou eliminação:</strong> solicitar a remoção de dados desnecessários</li>
              <li><strong className="text-white">Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong className="text-white">Revogação de consentimento:</strong> a qualquer momento</li>
              <li><strong className="text-white">Oposição:</strong> ao tratamento baseado em legítimo interesse</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer direito, envie email para <a href="mailto:privacidade@lavai.com.br" className="text-cyan-400 hover:underline">privacidade@lavai.com.br</a> ou use o formulário de <Link href="/lgpd/excluir" className="text-cyan-400 hover:underline">exclusão de dados</Link>. Respondemos em até <strong className="text-white">15 dias</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Segurança</h2>
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (HTTPS/TLS), Row-Level Security no banco, controle de acesso por papel, registro de auditoria. Em caso de incidente, notificamos a ANPD e os titulares afetados em até 72 horas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Cookies</h2>
            <p>Usamos cookies essenciais (sessão, autenticação) e cookies analíticos opcionais (Google Analytics, com IP anonimizado). Você pode desabilitar cookies no navegador — algumas funcionalidades podem ficar indisponíveis.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Retenção</h2>
            <p>Mantemos dados pelo período necessário à finalidade (durante a relação contratual + 5 anos para obrigações fiscais). Após esse prazo, são anonimizados ou eliminados.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Contato e DPO</h2>
            <p>
              Dúvidas sobre esta política ou tratamento de dados:<br />
              <Mail size={14} className="inline mr-1" /> <a href="mailto:privacidade@lavai.com.br" className="text-cyan-400 hover:underline">privacidade@lavai.com.br</a>
            </p>
            <p className="mt-3 text-sm text-gray-500">Esta política pode ser atualizada. Mudanças significativas serão comunicadas por email com 30 dias de antecedência.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between text-sm">
          <Link href="/" className="text-gray-400 hover:text-white">← Voltar ao início</Link>
          <Link href="/termos" className="text-cyan-400 hover:underline">Termos de Uso →</Link>
        </div>
      </article>
    </main>
  )
}
