'use client'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Clock } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08090f' }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col overflow-hidden">
        <Header title="Em breve" subtitle="Esta funcionalidade está sendo desenvolvida" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Clock size={28} className="text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Em desenvolvimento</h2>
            <p className="text-gray-500 text-sm max-w-xs">Esta funcionalidade faz parte do roadmap e será lançada em breve.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
