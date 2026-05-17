interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 16, md: 24, lg: 40 }
const strokeMap = { sm: 2, md: 2.5, lg: 3 }

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const px = sizeMap[size]
  const sw = strokeMap[size]
  const r = (px - sw * 2) / 2
  const c = px / 2

  return (
    <svg
      width={px}
      height={px}
      viewBox={"0 0 " + px + " " + px}
      className={className}
      style={{ animation: 'spin 0.75s linear infinite' }}
      aria-label="Carregando"
    >
      <style>{"@keyframes spin { to { transform: rotate(360deg) } }"}</style>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth={sw} />
      <circle
        cx={c} cy={c} r={r} fill="none" stroke="#00d4ff"
        strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={(r * 1.4) + " " + (r * 10)}
        strokeDashoffset={r * 0.35}
      />
    </svg>
  )
}
