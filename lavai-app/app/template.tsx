'use client'

// Template re-monta a cada navegação (diferente de layout.tsx que persiste).
// Aplica uma transição de entrada suave (só opacity) em todas as rotas.
// Mitigação F3 do pre-mortem: opacity-only é leve e estável no Safari iOS,
// e não cria containing block que quebraria position:fixed nas páginas.

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-in">{children}</div>
}
