export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#08090f' }}>
      {/* Header skeleton */}
      <div
        className="h-16 flex items-center justify-between px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded-lg" style={{ background: '#1a1a2e' }} />
          <div className="h-3 w-56 animate-pulse rounded-lg" style={{ background: '#1a1a2e' }} />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 animate-pulse rounded-xl hidden md:block" style={{ background: '#1a1a2e' }} />
          <div className="h-9 w-9 animate-pulse rounded-xl" style={{ background: '#1a1a2e' }} />
          <div className="h-9 w-9 animate-pulse rounded-xl" style={{ background: '#1a1a2e' }} />
          <div className="h-9 w-24 animate-pulse rounded-xl" style={{ background: '#1a1a2e' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* AI Insight skeleton */}
        <div className="h-12 w-full animate-pulse rounded-xl" style={{ background: '#1a1a2e' }} />

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 space-y-4 animate-pulse"
              style={{ background: '#0f1117', border: '1px solid #1a1a2e' }}
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 rounded-lg" style={{ background: '#1a1a2e' }} />
                <div className="w-9 h-9 rounded-xl" style={{ background: '#1a1a2e' }} />
              </div>
              <div className="h-8 w-20 rounded-lg" style={{ background: '#1a1a2e' }} />
              {/* Sparkline */}
              <div className="h-8 w-full rounded-md" style={{ background: '#1a1a2e' }} />
              <div className="h-3 w-16 rounded-lg" style={{ background: '#1a1a2e' }} />
            </div>
          ))}
        </div>

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Fila skeleton */}
          <div
            className="xl:col-span-2 rounded-2xl p-5 space-y-4 animate-pulse"
            style={{ background: '#0f1117', border: '1px solid #1a1a2e' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg" style={{ background: '#1a1a2e' }} />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-20 rounded-md" style={{ background: '#1a1a2e' }} />
                  <div className="h-2.5 w-28 rounded-md" style={{ background: '#1a1a2e' }} />
                </div>
              </div>
              <div className="h-3 w-14 rounded-md" style={{ background: '#1a1a2e' }} />
            </div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: '#1a1a2e' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded-md" style={{ background: '#1a1a2e' }} />
                  <div className="h-2.5 w-48 rounded-md" style={{ background: '#1a1a2e' }} />
                </div>
                <div className="space-y-1.5 items-end flex flex-col">
                  <div className="h-5 w-20 rounded-full" style={{ background: '#1a1a2e' }} />
                  <div className="h-3 w-12 rounded-md" style={{ background: '#1a1a2e' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Right column skeleton */}
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: '#0f1117', border: '1px solid #1a1a2e' }}
            >
              <div className="h-3.5 w-28 rounded-md mb-4" style={{ background: '#1a1a2e' }} />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl" style={{ background: '#1a1a2e' }} />
                ))}
              </div>
            </div>
            <div
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: '#0f1117', border: '1px solid #1a1a2e' }}
            >
              <div className="h-3.5 w-24 rounded-md mb-4" style={{ background: '#1a1a2e' }} />
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 w-full rounded-lg" style={{ background: '#1a1a2e' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart skeleton */}
        <div
          className="rounded-2xl p-5 animate-pulse"
          style={{ background: '#0f1117', border: '1px solid #1a1a2e' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg" style={{ background: '#1a1a2e' }} />
              <div className="space-y-1.5">
                <div className="h-3.5 w-40 rounded-md" style={{ background: '#1a1a2e' }} />
                <div className="h-2.5 w-24 rounded-md" style={{ background: '#1a1a2e' }} />
              </div>
            </div>
          </div>
          <div className="h-44 w-full rounded-xl" style={{ background: '#1a1a2e' }} />
        </div>
      </div>
    </div>
  )
}
