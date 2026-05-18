import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Insights de IA | LAVAI',
  description: 'Análise inteligente do seu lava-jato com insights acionáveis gerados por IA.',
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: 'var(--sidebar-width, 240px)' }}
      >
        <style>{`
          @media (max-width: 1023px) {
            main { margin-left: 0 !important; }
          }
        `}</style>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-500 text-sm">Carregando insights…</div>
          </div>
        }>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
