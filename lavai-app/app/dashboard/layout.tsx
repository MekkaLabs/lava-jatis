import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
