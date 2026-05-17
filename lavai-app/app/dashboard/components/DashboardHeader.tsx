'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface DashboardHeaderProps {
  subtitle: string
}

export default function DashboardHeader({ subtitle }: DashboardHeaderProps) {
  const router = useRouter()
  return (
    <Header
      title="Dashboard"
      subtitle={subtitle}
      action={{ label: 'Nova OS', onClick: () => router.push('/fila') }}
    />
  )
}
