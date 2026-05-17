import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import DashboardSkeleton from './components/DashboardSkeleton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />

      {/* Main content — on desktop offset by sidebar width, on mobile full width (sidebar overlays) */}
      <main
        className="flex-1 flex flex-col overflow-y-auto"
        style={{ marginLeft: 'var(--sidebar-width, 240px)' }}
      >
        <style>{`
          @media (max-width: 1023px) {
            main { margin-left: 0 !important; }
          }
        `}</style>
        <Suspense fallback={<DashboardSkeleton />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
