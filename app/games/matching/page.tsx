'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { speakWord as speakWordUtil } from '@/lib/games'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

const CARD_SETS = [
  { emoji: '🐶', name: 'dog' }, { emoji: '🐱', name: 'cat' }, { emoji: '🐸', name: 'frog' },
  { emoji: '🦋', name: 'butterfly' }, { emoji: '🐢', name: 'turtle' }, { emoji: '🐙', name: 'octopus' },
  { emoji: '🦕', name: 'dinosaur' }, { emoji: '🐘', name: 'elephant' }, { emoji: '🦊', name: 'fox' },
  { emoji: '🐧', name: 'penguin' }, { emoji: '🌈', name: 'rainbow' }, { emoji: '⭐', name: 'star' },
]

interface Card { id: number; emoji: string; name: string; isFlipped: boolean; isMatched: boolean }
type GridSize = 'small' | 'medium' | 'large'

const GRID_CONFIG = {
  small: { pairs: 4, labelKey: 'matching.4pairs', cols: 'grid-cols-4' },
  medium: { pairs: 6, labelKey: 'matching.6pairs', cols: 'grid-cols-4' },
  large: { pairs: 8, labelKey: 'matching.8pairs', cols: 'grid-cols-4' },
}

function createBoard(pairCount: number): Card[] {
  const selected = [...CARD_SETS].sort(() => Math.random() - 0.5).slice(0, pairCount)
  const cards: Card[] = []
  selected.forEach((item, i) => {
    cards.push({ id: i * 2, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false })
    cards.push({ id: i * 2 + 1, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false })
  })
  return cards.sort(() => Math.random() - 0.5)
}

// ---- Canvas state (Treasure Cave) ----

interface CaveState {
  runTimer: number
  torches: { x: number; phase: number }[]
  drips: { x: number; y: number; speed: number }[]
  explorerBob: number
  explorerDance: number
  sparkles: { x: number; y: number; life: number }[]
}

const CANVAS_MAX_W = 600

export default function MatchingGame() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const mario = useMarioGame()
  const [gridSize, setGridSize] = useState<GridSize | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  const totalPairs = gridSize ? GRID_CONFIG[gridSize].pairs : 0

  const { canvasRef, stateRef, canvasWidth } = useArcadeCanvas<CaveState>({
    init: () => {
      const torches: CaveState['torches'] = []
      for (let i = 0; i < 4; i++) torches.push({ x: 30 + i * 180, phase: Math.random() * Math.PI * 2 })
      const drips: CaveState['drips'] = []
      for (let i = 0; i < 8; i++) drips.push({ x: Math.random() * CANVAS_MAX_W, y: Math.random() * CANVAS_H, speed: 0.5 + Math.random() * 1 })
      return { runTimer: 0, torches, drips, explorerBob: 0, explorerDance: 0, sparkles: [] }
    },

    update: (g) => {
      g.runTimer++
      g.explorerBob = Math.sin(g.runTimer * 0.05) * 2
      if (g.explorerDance > 0) g.explorerDance--

      for (const d of g.drips) {
        d.y += d.speed
        if (d.y > CANVAS_H) { d.y = -5; d.x = Math.random() * CANVAS_MAX_W }
      }

      // Sparkles fade
      g.sparkles = g.sparkles.filter(s => s.life > 0)
      for (const s of g.sparkles) s.life--
    },

    draw: (ctx, g, cw) => {
      // Cave gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#1A0E0A')
      grad.addColorStop(0.5, '#2A1A12')
      grad.addColorStop(1, '#1A0E0A')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Stalactites
      ctx.fillStyle = '#3A2A1A'
      for (let i = 0; i < 8; i++) {
        const sx = 30 + i * 80 + Math.sin(i) * 20
        const sh = 15 + Math.sin(i * 2.5) * 10
        ctx.beginPath()
        ctx.moveTo(sx - 8, 0)
        ctx.lineTo(sx, sh)
        ctx.lineTo(sx + 8, 0)
        ctx.fill()
      }

      // Torches
      for (const t of g.torches) {
        // Bracket
        ctx.fillStyle = '#666'
        ctx.fillRect(t.x - 2, 50, 4, 20)
        // Flame
        const fl = Math.sin(g.runTimer * 0.2 + t.phase) * 3
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        ctx.moveTo(t.x - 5, 50)
        ctx.quadraticCurveTo(t.x + fl, 30, t.x + 5, 50)
        ctx.fill()
        ctx.fillStyle = '#FFD93D'
        ctx.beginPath()
        ctx.moveTo(t.x - 2, 50)
        ctx.quadraticCurveTo(t.x + fl * 0.5, 38, t.x + 2, 50)
        ctx.fill()
        // Glow
        ctx.save()
        ctx.globalAlpha = 0.06
        ctx.fillStyle = '#FF8C42'
        ctx.beginPath()
        ctx.arc(t.x, 45, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Dripping water
      ctx.fillStyle = 'rgba(100,180,255,0.3)'
      for (const d of g.drips) {
        ctx.beginPath()
        ctx.ellipse(d.x, d.y, 1.5, 3, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Explorer character (bottom left)
      const ex = 30
      const ey = CANVAS_H - 60 + g.explorerBob
      const dancing = g.explorerDance > 0
      // Body
      ctx.fillStyle = '#B8860B'
      ctx.fillRect(ex - 7, ey + 12, 14, 16)
      // Head
      ctx.fillStyle = '#FFCC80'
      ctx.beginPath()
      ctx.arc(ex, ey + 5, 7, 0, Math.PI * 2)
      ctx.fill()
      // Explorer hat
      ctx.fillStyle = '#8B6914'
      ctx.fillRect(ex - 10, ey - 4, 20, 4)
      ctx.fillRect(ex - 6, ey - 10, 12, 8)
      // Eyes
      ctx.fillStyle = '#000'
      ctx.fillRect(ex - 3, ey + 3, 2, 2)
      ctx.fillRect(ex + 1, ey + 3, 2, 2)
      // Arms
      ctx.strokeStyle = '#FFCC80'
      ctx.lineWidth = 2
      if (dancing) {
        const wave = Math.sin(g.runTimer * 0.3) * 0.5
        ctx.beginPath(); ctx.moveTo(ex - 7, ey + 15); ctx.lineTo(ex - 15, ey + 5 + wave * 10); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ex + 7, ey + 15); ctx.lineTo(ex + 15, ey + 5 - wave * 10); ctx.stroke()
      } else {
        ctx.beginPath(); ctx.moveTo(ex - 7, ey + 15); ctx.lineTo(ex - 12, ey + 25); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ex + 7, ey + 15); ctx.lineTo(ex + 12, ey + 25); ctx.stroke()
      }
      // Legs
      ctx.fillStyle = '#5C3A1E'
      ctx.fillRect(ex - 5, ey + 28, 4, 8)
      ctx.fillRect(ex + 1, ey + 28, 4, 8)

      // Sparkles
      for (const s of g.sparkles) {
        ctx.fillStyle = `rgba(255,215,0,${s.life / 30})`
        ctx.font = `${8 + s.life * 0.3}px sans-serif`
        ctx.fillText('✨', s.x, s.y - (30 - s.life))
      }

      // Cave floor
      ctx.fillStyle = '#2A1A0E'
      ctx.fillRect(0, CANVAS_H - 20, cw, 20)
      ctx.fillStyle = '#3A2A1A'
      ctx.fillRect(0, CANVAS_H - 20, cw, 3)
    },
  })

  const triggerDance = useCallback(() => {
    const g = stateRef.current
    if (g) {
      g.explorerDance = 30
      for (let i = 0; i < 5; i++) {
        g.sparkles.push({ x: 20 + Math.random() * 40, y: CANVAS_H - 80 + Math.random() * 30, life: 30 })
      }
    }
  }, [stateRef])

  const startGame = useCallback((size: GridSize) => {
    setGridSize(size)
    setCards(createBoard(GRID_CONFIG[size].pairs))
    setFlippedCards([])
    setMatches(0)
    setMoves(0)
    setGameWon(false)
    setFeedback(null)
    setLocked(false)
    mario.resetGame()
  }, [mario])

  useEffect(() => {
    if (matches > 0 && matches === totalPairs) setGameWon(true)
  }, [matches, totalPairs])

  const handleCardClick = (index: number) => {
    if (locked) return
    if (cards[index].isFlipped || cards[index].isMatched) return
    if (flippedCards.length >= 2) return

    const newCards = [...cards]
    newCards[index].isFlipped = true
    setCards(newCards)
    speakWordUtil(t('card.' + newCards[index].name), lang)

    const newFlipped = [...flippedCards, index]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)
      const [first, second] = newFlipped
      if (cards[first].name === cards[second].name) {
        setTimeout(() => {
          const matched = [...cards]
          matched[first].isMatched = true
          matched[second].isMatched = true
          setCards(matched)
          setMatches(m => m + 1)
          setFlippedCards([])
          setLocked(false)
          setFeedback(mario.onCorrect(lang))
          triggerDance()
          setTimeout(() => setFeedback(null), 1000)
        }, 500)
      } else {
        setTimeout(() => {
          const reset = [...cards]
          reset[first].isFlipped = false
          reset[second].isFlipped = false
          setCards(reset)
          setFlippedCards([])
          setLocked(false)
        }, 800)
      }
    }
  }

  if (!gridSize) {
    return (
      <GameLayout>
        <GameHeader title={t('game.matching.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
          <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
            className="rounded-2xl border-4 border-amber-600 shadow-[0_8px_0_rgba(180,83,9,0.4)]"
            style={{ maxWidth: '100%' }} />
        </div>
        <p className="text-lg text-white/70 font-bold">{t('matching.howManyPairs')}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          {(Object.keys(GRID_CONFIG) as GridSize[]).map((size, i) => {
            const colors: Array<'green' | 'yellow' | 'red'> = ['green', 'yellow', 'red']
            return <GameButton key={size} onClick={() => startGame(size)} color={colors[i]} size="lg">{t(GRID_CONFIG[size].labelKey)}</GameButton>
          })}
        </div>
        <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
      </GameLayout>
    )
  }

  if (gameWon) {
    return (
      <GameLayout>
        <GameHeader title={t('game.matching.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
          <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
            className="rounded-2xl border-4 border-amber-600 shadow-[0_8px_0_rgba(180,83,9,0.4)]"
            style={{ maxWidth: '100%' }} />
        </div>
        <div className="text-center">
          <p className="text-5xl mb-2">🏆</p>
          <p className="text-xl text-white font-bold">{t('matching.allFound').replace('{totalPairs}', String(totalPairs)).replace('{moves}', String(moves))}</p>
          <p className="text-lg text-[#FFD93D]">🪙 x {mario.coins}</p>
        </div>
        <div className="flex gap-4">
          <GameButton onClick={() => startGame(gridSize)} color="green" size="lg">{t('matching.playAgain')}</GameButton>
          <GameButton onClick={() => setGridSize(null)} color="yellow" size="lg">{t('matching.changeSize')}</GameButton>
        </div>
        <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <GameHeader title={t('game.matching.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={() => { mario.resetGame(); if (gridSize) startGame(gridSize) }} />}

      <div className="flex flex-col items-center gap-3 w-full max-w-2xl relative">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          className="rounded-2xl border-4 border-amber-600 shadow-[0_8px_0_rgba(180,83,9,0.4)]"
          style={{ maxWidth: '100%' }} />

        {/* Card grid overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className={`grid ${GRID_CONFIG[gridSize].cols} gap-1.5 sm:gap-2 w-full max-w-sm`}>
            {cards.map((card, index) => (
              <button key={card.id}
                onClick={() => card.isMatched ? speakWordUtil(t('card.' + card.name), lang) : handleCardClick(index)}
                disabled={locked && !card.isMatched}
                className={`aspect-square rounded-lg border-3 flex flex-col items-center justify-center transition-all duration-300 ${
                  card.isMatched ? 'border-green-400 bg-green-900/80 scale-95' :
                  card.isFlipped ? 'border-yellow-400 bg-yellow-900/80' :
                  'border-amber-700 bg-amber-900/70 hover:border-amber-500 cursor-pointer'
                }`}>
                {card.isFlipped || card.isMatched ? (
                  <>
                    <span className="text-2xl sm:text-3xl">{card.emoji}</span>
                    <span className="text-[8px] sm:text-xs font-bold text-white/80">{t('card.' + card.name)}</span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl">❓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {feedback && <p className="text-xl font-bold text-green-400">{feedback}</p>}
        <p className="text-white/50 text-sm">{t('matching.status').replace('{matches}', String(matches)).replace('{totalPairs}', String(totalPairs)).replace('{moves}', String(moves))}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
