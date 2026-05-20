'use client'

import { useEffect, useState } from 'react'
import { X, Share, Plus, Smartphone } from 'lucide-react'

// PWA install prompt — mitigação F1 do pre-mortem:
// "PWA não é instalado, vira só site". Mostra banner explícito + tutorial
// no primeiro uso de mobile que NÃO está em standalone.

type Platform = 'ios' | 'android' | 'desktop' | 'unknown'

const DISMISS_KEY = 'lavai_pwa_install_dismissed_at'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias
const INITIAL_DELAY_MS = 3000

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [platform, setPlatform] = useState<Platform>('unknown')

  useEffect(() => {
    if (isStandaloneMode()) return

    const p = detectPlatform()
    if (p === 'desktop' || p === 'unknown') return

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY)
      if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS) {
        return
      }
    } catch {
      // localStorage indisponível (Safari privado) — segue
    }

    setPlatform(p)
    const t = setTimeout(() => setShow(true), INITIAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {/* noop */}
    setShow(false)
    setShowTutorial(false)
  }

  if (!show) return null

  return (
    <>
      {/* Banner fixo bottom (mobile only) */}
      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden" role="dialog" aria-label="Instalar LAVAI">
        <div
          className="rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0f1117, #1a1c28)',
            border: '1px solid rgba(0,212,255,0.3)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,212,255,0.1)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
          >
            <Smartphone size={18} color="#000" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Instale o LAVAI</p>
            <p className="text-xs text-gray-400 truncate">Vira app na sua tela inicial</p>
          </div>
          <button
            onClick={() => setShowTutorial(true)}
            className="px-3 py-2 rounded-lg text-xs font-bold text-black flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
          >
            Como?
          </button>
          <button
            onClick={dismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white flex-shrink-0 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Dispensar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tutorial bottom sheet */}
      {showTutorial && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowTutorial(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          />
          <div
            className="relative w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-white/15 mx-auto mb-5" />

            <h2 className="text-xl font-bold text-white mb-1">Instale o LAVAI no celular</h2>
            <p className="text-sm text-gray-400 mb-6">
              {platform === 'ios'
                ? 'No Safari, 3 passos rápidos:'
                : 'No Chrome, 2 passos rápidos:'}
            </p>

            {platform === 'ios' ? (
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
                  >
                    1
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold flex items-center gap-2">
                      Toque em <Share size={16} className="text-cyan-400" />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ícone de compartilhar — na barra inferior do Safari.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
                  >
                    2
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      Role e toque em &quot;Adicionar à Tela de Início&quot;
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      Pode aparecer com <Plus size={11} className="text-cyan-400" /> ao lado.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
                  >
                    3
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      Toque em &quot;Adicionar&quot; no canto superior direito
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pronto. Agora o LAVAI vira app na sua tela inicial.
                    </p>
                  </div>
                </li>
              </ol>
            ) : (
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
                  >
                    1
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Toque no menu (⋮) do Chrome</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Três pontinhos no canto superior direito do navegador.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
                  >
                    2
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      Toque em &quot;Instalar app&quot; ou &quot;Adicionar à tela inicial&quot;
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pronto. Agora o LAVAI vira app na sua tela inicial.
                    </p>
                  </div>
                </li>
              </ol>
            )}

            <div
              className="mt-6 p-3.5 rounded-xl text-xs"
              style={{
                background: 'rgba(0,212,255,0.05)',
                border: '1px solid rgba(0,212,255,0.15)',
              }}
            >
              <p className="text-cyan-400 font-bold mb-1">Por que instalar?</p>
              <p className="text-gray-400 leading-relaxed">
                Tela cheia (sem barra do navegador), acesso em 1 toque na tela inicial e
                notificações de pedidos chegando.
              </p>
            </div>

            <button
              onClick={dismiss}
              className="w-full mt-5 py-3.5 rounded-xl font-bold text-black text-sm active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #4f8eff)' }}
            >
              Entendi
            </button>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full mt-2 py-2.5 text-sm text-gray-500 hover:text-white"
            >
              Talvez depois
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  )
}
