import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ---- Card 1: Glassmorphic card (books, activity pages, profiles, home menu tiles) ----
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
  const styles = `backdrop-blur-md bg-white/10 rounded-2xl border-2 border-zinc-200 shadow-lg overflow-hidden hover:shadow-xl hover:border-black transition-all ${onClick || href ? 'cursor-pointer' : ''} ${className}`

  if (href) {
    return <Link href={href} className={styles}>{children}</Link>
  }

  return (
    <div onClick={onClick} className={styles}>
      {children}
    </div>
  )
}

// ---- Card 2: Colorful bordered card (all games) ----
export function GameCard({
  children,
  color = 'purple',
  className = '',
}: {
  children: React.ReactNode
  color?: 'purple' | 'blue' | 'green' | 'indigo' | 'orange' | 'yellow'
  className?: string
}) {
  const colorMap = {
    purple: 'border-purple-300 bg-purple-50/50',
    blue: 'border-blue-300 bg-blue-50/50',
    green: 'border-green-300 bg-green-50',
    indigo: 'border-indigo-300 bg-indigo-50/50',
    orange: 'border-orange-300 bg-orange-50',
    yellow: 'border-yellow-300 bg-yellow-50',
  }

  return (
    <div className={`rounded-3xl border-4 p-6 sm:p-10 text-center transition-colors duration-300 w-full max-w-md ${colorMap[color]} ${className}`}>
      {children}
    </div>
  )
}

// ---- Shared image helpers ----

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
    <Image src={src} alt={alt} width={size} height={size} priority />
  )
}

// ---- Shared helpers ----

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
    <div className="relative h-64">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-contain" />
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-6xl">{fallbackEmoji}</span>
        </div>
      )}
    </div>
  )
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
    green: 'bg-green-500 text-white hover:bg-green-600',
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
    indigo: 'bg-indigo-500 text-white hover:bg-indigo-600',
    yellow: 'bg-yellow-400 text-black hover:bg-yellow-500',
    orange: 'bg-orange-400 text-white hover:bg-orange-500',
    red: 'bg-red-500 text-white hover:bg-red-600',
    black: 'bg-black text-white hover:bg-zinc-800',
  }

  const sizeMap = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${colorMap[color]} ${sizeMap[size]} rounded-xl font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

export function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8">
      {children}
    </div>
  )
}

export function GameHeader({ title, score }: { title: string; score: number }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl sm:text-5xl font-bold text-black mb-1">{title}</h1>
      <p className="text-lg text-zinc-500">
        Stars collected: {'⭐'.repeat(Math.min(score, 20))} {score > 20 && `(${score})`}
      </p>
    </div>
  )
}
