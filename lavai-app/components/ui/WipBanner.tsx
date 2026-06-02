// WipBanner — banner amarelo persistente que avisa "feature em desenvolvimento"
// pra páginas onde o formulário ainda não persiste no backend (setTimeout-only).
// Mais honesto que toast verde "Salvo!" sobre nada salvo.

import { Wrench } from 'lucide-react'

interface Props {
  /** Mensagem curta. Ex: "Esta tela ainda não salva no banco." */
  children: React.ReactNode
  /** Tarefa de roadmap relacionada (mostra opcional). Ex: "AJ4" */
  taskRef?: string
}

export default function WipBanner({ children, taskRef }: Props) {
  return (
    <div
      role="status"
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: 'rgba(255,214,0,0.06)',
        border: '1px solid rgba(255,214,0,0.25)',
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,214,0,0.15)' }}
      >
        <Wrench size={16} color="#ffd600" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white mb-0.5">Em desenvolvimento</p>
        <p className="text-xs text-gray-400">{children}</p>
      </div>
      {taskRef && (
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
        >
          {taskRef}
        </span>
      )}
    </div>
  )
}
