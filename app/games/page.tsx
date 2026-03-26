'use client'

import { useRef, useCallback } from 'react'
import { PageTitle } from '@/components/ui'
import Link from 'next/link'

const games = [
  {
    id: 'addition',
    title: 'ADDING FUN',
    description: 'Practice adding numbers together!',
    emoji: '➕',
    bg: '#0B3D1C',
    border: 'border-[#22C55E]',
    shadow: 'shadow-[0_8px_0_#166534]',
    hoverShadow: 'hover:shadow-[0_4px_0_#166534]',
  },
  {
    id: 'subtraction',
    title: 'TAKE AWAY',
    description: 'Practice subtraction with visual dots!',
    emoji: '➖',
    bg: '#0C4A6E',
    border: 'border-[#38BDF8]',
    shadow: 'shadow-[0_8px_0_#0369A1]',
    hoverShadow: 'hover:shadow-[0_4px_0_#0369A1]',
  },
  {
    id: 'counting',
    title: 'COUNTING',
    description: 'Count the objects on screen!',
    emoji: '🔢',
    bg: '#1A3A2A',
    border: 'border-[#4ECDC4]',
    shadow: 'shadow-[0_8px_0_#0F766E]',
    hoverShadow: 'hover:shadow-[0_4px_0_#0F766E]',
  },
  {
    id: 'typing',
    title: 'TYPE IT!',
    description: 'Listen and type the word!',
    emoji: '⌨️',
    bg: '#0C4A6E',
    border: 'border-[#38BDF8]',
    shadow: 'shadow-[0_8px_0_#0369A1]',
    hoverShadow: 'hover:shadow-[0_4px_0_#0369A1]',
  },
  {
    id: 'word-scramble',
    title: 'SCRAMBLE',
    description: 'Unscramble letters to make a word!',
    emoji: '🔤',
    bg: '#3D3A0A',
    border: 'border-[#FFD93D]',
    shadow: 'shadow-[0_8px_0_#a16207]',
    hoverShadow: 'hover:shadow-[0_4px_0_#a16207]',
  },
  {
    id: 'matching',
    title: 'MATCH IT!',
    description: 'Find the matching pairs!',
    emoji: '🃏',
    bg: '#1A3A2A',
    border: 'border-[#4ECDC4]',
    shadow: 'shadow-[0_8px_0_#0F766E]',
    hoverShadow: 'hover:shadow-[0_4px_0_#0F766E]',
  },
  {
    id: 'simon-says',
    title: 'SIMON SAYS',
    description: 'Remember and repeat the pattern!',
    emoji: '🧠',
    bg: '#0C3650',
    border: 'border-[#38BDF8]',
    shadow: 'shadow-[0_8px_0_#0369A1]',
    hoverShadow: 'hover:shadow-[0_4px_0_#0369A1]',
  },
  {
    id: 'color-mix',
    title: 'COLOR MIX',
    description: 'Mix colors and guess the result!',
    emoji: '🎨',
    bg: '#0B3D1C',
    border: 'border-[#22C55E]',
    shadow: 'shadow-[0_8px_0_#166534]',
    hoverShadow: 'hover:shadow-[0_4px_0_#166534]',
  },
  {
    id: 'shape-builder',
    title: 'SHAPES',
    description: 'Identify different shapes!',
    emoji: '🔷',
    bg: '#0C3650',
    border: 'border-[#38BDF8]',
    shadow: 'shadow-[0_8px_0_#0369A1]',
    hoverShadow: 'hover:shadow-[0_4px_0_#0369A1]',
  },
  {
    id: 'animal-sounds',
    title: 'ANIMAL SOUNDS',
    description: 'Guess the animal from its sound!',
    emoji: '🔊',
    bg: '#4A2C0A',
    border: 'border-[#D4A76A]',
    shadow: 'shadow-[0_8px_0_#8B5E34]',
    hoverShadow: 'hover:shadow-[0_4px_0_#8B5E34]',
  },
  {
    id: 'odd-one-out',
    title: 'ODD ONE OUT',
    description: 'Find what doesn\'t belong!',
    emoji: '👀',
    bg: '#1A3A2A',
    border: 'border-[#4ECDC4]',
    shadow: 'shadow-[0_8px_0_#0F766E]',
    hoverShadow: 'hover:shadow-[0_4px_0_#0F766E]',
  },
  {
    id: 'writing',
    title: 'WRITE IT!',
    description: 'Trace and practice writing letters!',
    emoji: '✏️',
    bg: '#5C3D1E',
    border: 'border-[#D4A76A]',
    shadow: 'shadow-[0_8px_0_#8B5E34]',
    hoverShadow: 'hover:shadow-[0_4px_0_#8B5E34]',
  },
]

function useSoundEffect() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playPop = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }, [])

  return { playPop }
}

function GameCard3D({
  game,
  index,
}: {
  game: typeof games[0]
  index: number
}) {
  const { playPop } = useSoundEffect()

  return (
    <Link href={`/games/${game.id}`}>
      <div
        onMouseEnter={playPop}
        className={`relative flex flex-col items-center gap-3 p-6 sm:p-8 rounded-2xl border-4 ${game.border} ${game.shadow} ${game.hoverShadow} card-3d hover-glow animate-bounce-in stagger-${Math.min(index + 1, 6)} h-full`}
        style={{ background: game.bg, transformStyle: 'preserve-3d' }}
      >
        <div className="card-3d-shine" />
        <span className="text-7xl sm:text-8xl animate-float drop-shadow-lg">{game.emoji}</span>
        <h2
          className="text-2xl sm:text-3xl font-black text-white"
          style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
        >
          {game.title}
        </h2>
        <p className="text-sm text-white/60 text-center font-medium">{game.description}</p>
      </div>
    </Link>
  )
}

export default function GamesPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-12 animate-slide-up">
          <PageTitle
            src="/games.png"
            alt="Games"
            width={200}
            height={100}
          />
          <h1 className="hero-text text-4xl sm:text-6xl text-shimmer text-center">
            CHOOSE YOUR GAME
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game, i) => (
            <GameCard3D key={game.id} game={game} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
