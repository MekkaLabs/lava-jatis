import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'LAVAI — O Sistema Operacional do Lava-Jato Moderno',
  description: 'Agendamento inteligente, fila em tempo real, WhatsApp bot com IA e programa de fidelidade Web3 para lava-jatos brasileiros.',
  keywords: ['lava-jato', 'sistema', 'agendamento', 'IA', 'WhatsApp'],
  openGraph: {
    title: 'LAVAI',
    description: 'O sistema operacional do lava-jato moderno.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
