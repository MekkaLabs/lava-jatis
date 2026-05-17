import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/fila',
          '/financeiro',
          '/clientes',
          '/equipe',
          '/api',
        ],
      },
    ],
    sitemap: 'https://lavai.com.br/sitemap.xml',
  }
}
