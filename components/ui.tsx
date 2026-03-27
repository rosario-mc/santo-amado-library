import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n'

// ---- Card: Bold card with 3D tilt ----
export function Card({
  children,
  onClick,
  href,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}) {
  const styles = `relative bg-[#143D22] rounded-2xl border-3 border-[#22C55E]/40 shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden card-3d ${onClick || href ? 'cursor-pointer' : ''} ${className}`

  if (href) {
    return (
      <Link href={href} className={styles}>
        <div className="card-3d-shine" />
        {children}
      </Link>
    )
  }

  return (
    <div onClick={onClick} className={styles}>
      <div className="card-3d-shine" />
      {children}
    </div>
  )
}

// ---- GameCard: Bold colored card with thick border ----
export function GameCard({
  children,
  color = 'purple',
  className = '',
}: {
  children: React.ReactNode
  color?: 'purple' | 'blue' | 'green' | 'indigo' | 'orange' | 'yellow' | 'mario'
  className?: string
}) {
  const colorMap = {
    purple: 'border-teal-500 bg-[#0C4A3A] shadow-[0_8px_0_rgba(20,184,166,0.4)]',
    blue: 'border-blue-500 bg-[#0C3A5A] shadow-[0_8px_0_rgba(59,130,246,0.4)]',
    green: 'border-green-500 bg-[#0B3D1C] shadow-[0_8px_0_rgba(34,197,94,0.4)]',
    indigo: 'border-sky-500 bg-[#0C3650] shadow-[0_8px_0_rgba(14,165,233,0.4)]',
    orange: 'border-orange-500 bg-[#4A2C0A] shadow-[0_8px_0_rgba(251,146,60,0.4)]',
    yellow: 'border-yellow-500 bg-[#3D3A0A] shadow-[0_8px_0_rgba(250,204,21,0.4)]',
    mario: 'mario-question-block border-4',
  }

  return (
    <div
      className={`relative rounded-2xl border-4 p-6 sm:p-10 text-center transition-all duration-300 w-full max-w-md card-3d hover:translate-y-[-6px] ${colorMap[color]} ${className}`}
    >
      <div className="card-3d-shine" />
      {children}
    </div>
  )
}

export function PageTitle({
  src,
  alt,
  width = 300,
  height = 150,
}: {
  src: string
  alt: string
  width?: number
  height?: number
}) {
  return (
    <Image src={src} alt={alt} width={width} height={height} priority />
  )
}

export function CardIcon({
  src,
  alt,
  size = 200,
}: {
  src: string
  alt: string
  size?: number
}) {
  return (
    <Image src={src} alt={alt} width={size} height={size} priority className="hover-bounce" />
  )
}

// ---- CoverImage ----

export function CoverImage({
  src,
  alt,
  fallbackEmoji = '📚',
}: {
  src: string | null
  alt: string
  fallbackEmoji?: string
}) {
  return (
    <div className="relative h-64 bg-[#0A2F15] rounded-xl m-3 overflow-hidden border border-[#22C55E]/20 group">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-6xl animate-float">{fallbackEmoji}</span>
        </div>
      )}
    </div>
  )
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {children}
    </div>
  )
}

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  )
}

// ---- WaveDivider: SVG wave between sections ----
export function WaveDivider({ from, to }: { from: string; to: string }) {
  return (
    <div className="w-full leading-[0] overflow-hidden" style={{ background: from }}>
      <svg viewBox="0 0 1200 50" preserveAspectRatio="none" className="w-full h-[50px] block" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,25 C150,50 350,0 500,25 C650,50 850,0 1000,25 C1100,35 1150,30 1200,25 L1200,50 L0,50 Z" fill={to} />
      </svg>
    </div>
  )
}

// ---- GameButton: 3D push effect, pill-shaped ----
export function GameButton({
  children,
  onClick,
  color = 'black',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  color?: 'green' | 'blue' | 'purple' | 'indigo' | 'yellow' | 'orange' | 'red' | 'black'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const colorMap = {
    green: 'bg-[#22C55E] text-[#0B3D1C] shadow-[0_6px_0_#166534] hover:shadow-[0_4px_0_#166534] hover:translate-y-[2px] active:shadow-[0_0px_0_#166534] active:translate-y-[6px]',
    blue: 'bg-[#38BDF8] text-[#0C4A6E] shadow-[0_6px_0_#0369A1] hover:shadow-[0_4px_0_#0369A1] hover:translate-y-[2px] active:shadow-[0_0px_0_#0369A1] active:translate-y-[6px]',
    purple: 'bg-[#4ECDC4] text-[#0B3D1C] shadow-[0_6px_0_#0F766E] hover:shadow-[0_4px_0_#0F766E] hover:translate-y-[2px] active:shadow-[0_0px_0_#0F766E] active:translate-y-[6px]',
    indigo: 'bg-[#38BDF8] text-[#0C4A6E] shadow-[0_6px_0_#0369A1] hover:shadow-[0_4px_0_#0369A1] hover:translate-y-[2px] active:shadow-[0_0px_0_#0369A1] active:translate-y-[6px]',
    yellow: 'bg-[#FFD93D] text-[#5C3D1E] shadow-[0_6px_0_#a16207] hover:shadow-[0_4px_0_#a16207] hover:translate-y-[2px] active:shadow-[0_0px_0_#a16207] active:translate-y-[6px]',
    orange: 'bg-[#D4A76A] text-[#5C3D1E] shadow-[0_6px_0_#8B5E34] hover:shadow-[0_4px_0_#8B5E34] hover:translate-y-[2px] active:shadow-[0_0px_0_#8B5E34] active:translate-y-[6px]',
    red: 'bg-red-500 text-white shadow-[0_6px_0_#991b1b] hover:shadow-[0_4px_0_#991b1b] hover:translate-y-[2px] active:shadow-[0_0px_0_#991b1b] active:translate-y-[6px]',
    black: 'bg-[#1a1a1a] text-white shadow-[0_6px_0_#000] hover:shadow-[0_4px_0_#000] hover:translate-y-[2px] active:shadow-[0_0px_0_#000] active:translate-y-[6px]',
  }

  const sizeMap = {
    sm: 'px-5 py-2 text-sm',
    md: 'px-7 py-3 text-base',
    lg: 'px-10 py-4 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${colorMap[color]} ${sizeMap[size]} rounded-full font-black tracking-wide transition-all duration-150 btn-press hover-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${className}`}
      style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
    >
      {children}
    </button>
  )
}

export function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8 relative overflow-hidden">
      {/* Floating ? blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <span className="absolute text-[12rem] font-black text-white/[0.03] question-drift-1" style={{ top: '10%', left: '5%' }}>?</span>
        <span className="absolute text-[8rem] font-black text-white/[0.03] question-drift-2" style={{ top: '60%', right: '8%' }}>?</span>
        <span className="absolute text-[10rem] font-black text-white/[0.03] question-drift-3" style={{ bottom: '5%', left: '40%' }}>?</span>
      </div>
      {children}
    </div>
  )
}

// ---- GameHeader: Bold text with coin counter + optional Mario HUD ----
export function GameHeader({
  title,
  score,
  lives,
  world,
  powerUp,
  onDismissPowerUp,
}: {
  title: string
  score: number
  lives?: number
  world?: string
  powerUp?: 'none' | 'mushroom' | 'star' | 'fire-flower' | '1-up' | 'rainbow-star'
  onDismissPowerUp?: () => void
}) {
  const { t } = useLanguage()

  return (
    <div className="text-center">
      <h1
        className="text-4xl sm:text-6xl font-black text-shimmer mb-3"
        style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
      >
        {title}
      </h1>

      {/* Mario HUD row */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {/* World badge */}
        {world && (
          <span className="px-3 py-1 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 text-sm font-bold text-[#22C55E]">
            {world}
          </span>
        )}

        {/* Coin counter */}
        <p className="text-lg font-bold text-[#FFD93D]">
          <span className="inline-block animate-coin-spin">🪙</span>{' '}
          x {score}
        </p>

        {/* Lives */}
        {lives !== undefined && (
          <p className="text-lg font-bold text-[#22C55E]">
            {Array.from({ length: lives }).map((_, i) => (
              <span key={i} className="inline-block">🍄</span>
            ))}
            {lives === 0 && <span className="text-red-400">0</span>}
          </p>
        )}
      </div>

      {/* Power-up overlay trigger */}
      {powerUp && powerUp !== 'none' && onDismissPowerUp && (
        <div className="mt-2">
          <span className="text-sm font-bold text-[#FFD93D]">
            {powerUp === 'rainbow-star' ? t('powerUp.rainbow') :
             powerUp === '1-up' ? t('powerUp.extraLife') :
             powerUp === 'fire-flower' ? t('powerUp.fireFlower') :
             powerUp === 'star' ? t('powerUp.star') : t('powerUp.mushroom')}
          </span>
        </div>
      )}
    </div>
  )
}

// ---- Loading States ----

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <div className="loading-spinner" />
      <p
        className="text-2xl font-black text-[#22C55E]"
        style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
      >
        {text}
      </p>
      <div className="flex gap-2">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-[#143D22] rounded-2xl border-3 border-[#22C55E]/20 overflow-hidden">
      <div className="skeleton h-64 m-3 rounded-xl" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-6 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-10 w-full rounded-full mt-4" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
