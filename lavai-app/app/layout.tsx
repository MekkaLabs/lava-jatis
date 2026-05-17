import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const GA_ID = 'G-LAVAI2024'

export const viewport: Viewport = {
  themeColor: '#08090f',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://lavai.com.br'),
  title: {
    default: 'LAVAI — O Sistema Operacional do Lava-Jato Moderno',
    template: '%s | LAVAI',
  },
  description:
    'LAVAI — O sistema inteligente para lava-jatos. Gerencie filas, financeiro, equipe e fidelidade em um só lugar. Aumente seu faturamento hoje.',
  keywords: [
    'lava-jato',
    'sistema para lava-jato',
    'gestão lava-jato',
    'software lava-jato',
    'agendamento lava-jato',
    'fila lava-jato',
    'financeiro lava-jato',
    'IA lava-jato',
    'WhatsApp bot lava-jato',
    'fidelidade lava-jato',
    'LAVAI',
  ],
  authors: [{ name: 'LAVAI', url: 'https://lavai.com.br' }],
  creator: 'LAVAI',
  publisher: 'LAVAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://lavai.com.br',
    siteName: 'LAVAI',
    title: 'LAVAI — O Sistema Operacional do Lava-Jato Moderno',
    description:
      'LAVAI — O sistema inteligente para lava-jatos. Gerencie filas, financeiro, equipe e fidelidade em um só lugar.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LAVAI — Sistema para Lava-Jatos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LAVAI — O Sistema Operacional do Lava-Jato Moderno',
    description:
      'Gerencie filas, financeiro, equipe e fidelidade em um só lugar. Aumente seu faturamento hoje.',
    images: ['/og-image.png'],
    creator: '@lavai_br',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: 'https://lavai.com.br',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LAVAI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://lavai.com.br',
  description:
    'Sistema de gestão inteligente para lava-jatos brasileiros. Filas em tempo real, financeiro, equipe, fidelidade e IA integrada.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
    description: 'Plano gratuito disponível. Planos pagos a partir de R$97/mês.',
  },
  publisher: {
    '@type': 'Organization',
    name: 'LAVAI',
    url: 'https://lavai.com.br',
  },
  inLanguage: 'pt-BR',
  availableOnDevice: 'Desktop, Mobile',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <GoogleAnalytics gaId={GA_ID} />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
