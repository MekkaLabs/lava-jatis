import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LAVAI',
    short_name: 'LAVAI',
    description:
      'O sistema inteligente para lava-jatos. Gerencie filas, financeiro, equipe e fidelidade em um só lugar.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#08090f',
    theme_color: '#08090f',
    orientation: 'portrait',
    categories: ['business', 'productivity'],
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
