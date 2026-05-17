export const GA_MEASUREMENT_ID = 'G-LAVAI2024'

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
  }
}

export function pageview(url: string): void {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

export function event(
  action: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', action, params)
}
