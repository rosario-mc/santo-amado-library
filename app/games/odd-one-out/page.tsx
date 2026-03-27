'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawStars } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

// ---- Puzzle data ----

interface Puzzle {
  category: string; items: string[]; oddIndex: number; explanation: string; explainKey: string
}

const PUZZLES: Puzzle[] = [
  { category: 'Fruits', items: ['🍎', '🍌', '🍊', '🚗'], oddIndex: 3, explanation: 'A car is not a fruit!', explainKey: 'explain.car_fruit' },
  { category: 'Animals', items: ['🐶', '🌻', '🐱', '🐸'], oddIndex: 1, explanation: 'A flower is not an animal!', explainKey: 'explain.flower_animal' },
  { category: 'Vehicles', items: ['🚗', '🚀', '🎈', '🚌'], oddIndex: 2, explanation: 'A balloon is not a vehicle!', explainKey: 'explain.balloon_vehicle' },
  { category: 'Food', items: ['🍕', '🍔', '🎸', '🌮'], oddIndex: 2, explanation: 'A guitar is not food!', explainKey: 'explain.guitar_food' },
  { category: 'Sea creatures', items: ['🐟', '🦀', '🐙', '🐶'], oddIndex: 3, explanation: 'A dog is not a sea creature!', explainKey: 'explain.dog_sea' },
  { category: 'Sports', items: ['⚽', '🏀', '🎾', '🍰'], oddIndex: 3, explanation: 'Cake is not a sport!', explainKey: 'explain.cake_sport' },
  { category: 'Weather', items: ['☀️', '🌧️', '❄️', '🐱'], oddIndex: 3, explanation: 'A cat is not weather!', explainKey: 'explain.cat_weather' },
  { category: 'Insects', items: ['🐛', '🦋', '🐝', '🐘'], oddIndex: 3, explanation: 'An elephant is not an insect!', explainKey: 'explain.elephant_insect' },
  { category: 'Flowers', items: ['🌸', '🌹', '🌻', '🔥'], oddIndex: 3, explanation: 'Fire is not a flower!', explainKey: 'explain.fire_flower' },
  { category: 'Trees', items: ['🌲', '🎄', '🌴', '🍕'], oddIndex: 3, explanation: 'Pizza is not a tree!', explainKey: 'explain.pizza_tree' },
  { category: 'Birds', items: ['🦅', '🐦', '🐧', '🐍'], oddIndex: 3, explanation: 'A snake is not a bird!', explainKey: 'explain.snake_bird' },
  { category: 'Tools', items: ['🔨', '🪛', '🔧', '🎵'], oddIndex: 3, explanation: 'Music is not a tool!', explainKey: 'explain.music_tool' },
]

let puzzleDeck: number[] = []

function getRandomPuzzle(): Puzzle {
  if (puzzleDeck.length === 0) {
    puzzleDeck = Array.from({ length: PUZZLES.length }, (_, i) => i).sort(() => Math.random() - 0.5)
  }
  const puzzle = PUZZLES[puzzleDeck.pop()!]
  const oddItem = puzzle.items[puzzle.oddIndex]
  const shuffled = [...puzzle.items].sort(() => Math.random() - 0.5)
  return { ...puzzle, items: shuffled, oddIndex: shuffled.indexOf(oddItem) }
}

// ---- Canvas state (Space Station) ----

interface FloatingItem { x: number; y: number; vx: number; vy: number; emoji: string; idx: number; scale: number; bounceTimer: number }

interface SpaceState {
  runTimer: number
  stars: { x: number; y: number; r: number; twinkle: number }[]
  items: FloatingItem[]
  airlockOpen: number
  panelLights: number[]
}

const CANVAS_MAX_W = 600
const ITEM_SIZE = 50

export default function OddOneOutGame() {
  const router = useRouter()
  const mario = useMarioGame()
  const { lang, t } = useLanguage()
  const [puzzle, setPuzzle] = useState(getRandomPuzzle)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const puzzleRef = useRef(puzzle)
  puzzleRef.current = puzzle
  const feedbackRef = useRef(feedback)
  feedbackRef.current = feedback

  const { canvasRef, stateRef, canvasWidth, resetState: resetCanvas } = useArcadeCanvas<SpaceState>({
    init: () => {
      const stars: SpaceState['stars'] = []
      for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * CANVAS_MAX_W, y: Math.random() * CANVAS_H, r: 0.5 + Math.random() * 1.5, twinkle: Math.random() * Math.PI * 2 })
      const items: FloatingItem[] = puzzleRef.current.items.map((emoji, idx) => ({
        x: 100 + (idx % 2) * 200 + Math.random() * 40,
        y: 80 + Math.floor(idx / 2) * 120 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        emoji, idx, scale: 1, bounceTimer: 0,
      }))
      const panelLights: number[] = []
      for (let i = 0; i < 6; i++) panelLights.push(Math.random())
      return { runTimer: 0, stars, items, airlockOpen: 0, panelLights }
    },

    update: (g) => {
      g.runTimer++
      for (const s of g.stars) s.twinkle += 0.02
      for (const light of g.panelLights) light // panel lights just animate via runTimer

      // Float items in zero-g
      for (const item of g.items) {
        if (item.bounceTimer > 0) {
          item.bounceTimer--
          item.scale = 1 + Math.sin(item.bounceTimer * 0.3) * 0.15
        } else {
          item.scale += (1 - item.scale) * 0.1
        }
        item.x += item.vx
        item.y += item.vy
        // Bounce off walls
        if (item.x < 50 || item.x > CANVAS_MAX_W - 50) item.vx *= -1
        if (item.y < 40 || item.y > CANVAS_H - 40) item.vy *= -1
        item.x = Math.max(50, Math.min(CANVAS_MAX_W - 50, item.x))
        item.y = Math.max(40, Math.min(CANVAS_H - 40, item.y))
      }

      // Airlock animation
      if (g.airlockOpen > 0) g.airlockOpen = Math.max(0, g.airlockOpen - 0.02)
    },

    draw: (ctx, g, cw) => {
      // Space station interior
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#1A1A2E')
      grad.addColorStop(1, '#16213E')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Stars through window panels
      ctx.save()
      ctx.globalAlpha = 0.3
      drawStars(ctx, g.stars, cw)
      ctx.restore()

      // Station wall panels
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 2
      for (let i = 0; i < 4; i++) {
        ctx.strokeRect(10 + i * (cw / 4 - 5), 5, cw / 4 - 15, CANVAS_H - 10)
      }

      // Panel rivets
      ctx.fillStyle = '#475569'
      for (let x = 30; x < cw; x += cw / 4) {
        for (let y = 20; y < CANVAS_H; y += 60) {
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Blinking panel lights
      for (let i = 0; i < 6; i++) {
        const lx = 20 + i * 100
        const on = Math.sin(g.runTimer * 0.05 + i * 1.5) > 0
        ctx.fillStyle = on ? '#22C55E' : '#1A3A1A'
        ctx.beginPath()
        ctx.arc(lx, CANVAS_H - 15, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Airlock door (right side)
      const doorW = 40
      const doorH = 80
      const doorX = cw - doorW - 15
      const doorY = CANVAS_H / 2 - doorH / 2
      ctx.fillStyle = '#475569'
      ctx.fillRect(doorX, doorY, doorW, doorH)
      ctx.strokeStyle = '#EF4444'
      ctx.lineWidth = 2
      ctx.strokeRect(doorX, doorY, doorW, doorH)
      // Airlock label
      ctx.fillStyle = '#EF4444'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('AIRLOCK', doorX + doorW / 2, doorY + doorH + 12)

      // Question prompt
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText("Which one doesn't belong? Tap it!", cw / 2, 10)
      ctx.textBaseline = 'alphabetic'

      // Floating items
      for (const item of g.items) {
        ctx.save()
        ctx.translate(item.x, item.y)
        ctx.scale(item.scale, item.scale)
        ctx.font = `${ITEM_SIZE}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(item.emoji, 0, 0)

        // Glow around items
        ctx.save()
        ctx.globalAlpha = 0.1
        ctx.beginPath()
        ctx.arc(0, 0, ITEM_SIZE * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = '#60A5FA'
        ctx.fill()
        ctx.restore()

        ctx.restore()
      }

      // Feedback text
      if (feedbackRef.current) {
        ctx.fillStyle = isCorrect ? '#22C55E' : '#EF4444'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(feedbackRef.current, cw / 2, CANVAS_H - 40)
      }
    },
  })

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (feedback) return
    const canvas = canvasRef.current
    const g = stateRef.current
    if (!canvas || !g) return

    const rect = canvas.getBoundingClientRect()
    let cx: number, cy: number
    if ('touches' in e) {
      cx = e.touches[0].clientX - rect.left
      cy = e.touches[0].clientY - rect.top
    } else {
      cx = e.clientX - rect.left
      cy = e.clientY - rect.top
    }

    // Scale to canvas coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    cx *= scaleX
    cy *= scaleY

    // Check which item was tapped
    for (const item of g.items) {
      const dx = cx - item.x
      const dy = cy - item.y
      if (Math.sqrt(dx * dx + dy * dy) < ITEM_SIZE * 0.6) {
        if (item.idx === puzzleRef.current.oddIndex) {
          // Correct!
          setFeedback(mario.onCorrect(lang))
          setIsCorrect(true)
          // Animate item toward airlock
          item.vx = 5
          item.vy = 0
          g.airlockOpen = 1
          setTimeout(() => {
            const next = getRandomPuzzle()
            setPuzzle(next)
            puzzleRef.current = next
            setFeedback(null)
            setIsCorrect(false)
            // Reset items
            next.items.forEach((emoji, idx) => {
              if (g.items[idx]) {
                g.items[idx].emoji = emoji
                g.items[idx].idx = idx
                g.items[idx].x = 100 + (idx % 2) * 200 + Math.random() * 40
                g.items[idx].y = 80 + Math.floor(idx / 2) * 120 + Math.random() * 20
                g.items[idx].vx = (Math.random() - 0.5) * 0.5
                g.items[idx].vy = (Math.random() - 0.5) * 0.5
                g.items[idx].scale = 1
              }
            })
          }, 1500)
        } else {
          // Wrong — bounce back
          mario.onWrong()
          setFeedback(t('notThatOne'))
          setIsCorrect(false)
          item.bounceTimer = 20
          item.vx *= -2
          item.vy *= -2
          setTimeout(() => setFeedback(null), 1000)
        }
        return
      }
    }
  }, [feedback, canvasRef, stateRef, mario])

  const handleReset = useCallback(() => {
    mario.resetGame()
    const next = getRandomPuzzle()
    setPuzzle(next)
    puzzleRef.current = next
    setFeedback(null)
    setIsCorrect(false)
    resetCanvas()
  }, [mario, resetCanvas])

  return (
    <GameLayout>
      <GameHeader title={t('game.oddOneOut.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={handleReset} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          onClick={handleCanvasClick}
          onTouchStart={(e) => { e.preventDefault(); handleCanvasClick(e) }}
          className="rounded-2xl border-4 border-sky-500 shadow-[0_8px_0_rgba(14,165,233,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {feedback && isCorrect && (
          <p className="text-sm text-white/50">{t(puzzle.explainKey)}</p>
        )}

        <p className="text-white/60 text-sm text-center">{t('oddOneOut.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
