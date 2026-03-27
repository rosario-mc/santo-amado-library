'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawCloud, drawSkyGradient, drawGround } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

const EMOJIS = ['🐶', '🐱', '🐸', '🌟', '🍎', '🚗', '🎈', '🐟', '🌻', '🦋']

let lastCountKey = ''

function generateProblem(maxCount: number) {
  let count: number, emoji: string
  let attempts = 0
  do {
    count = Math.floor(Math.random() * maxCount) + 1
    emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    attempts++
  } while (`${count}-${emoji}` === lastCountKey && attempts < 10)
  lastCountKey = `${count}-${emoji}`
  return { count, emoji }
}

// ---- Canvas state (Garden Harvest) ----

interface Butterfly { x: number; y: number; wingPhase: number; color: string; dx: number; dy: number }
interface Flower { x: number; type: number; swayPhase: number }

interface GardenState {
  runTimer: number
  clouds: { x: number; y: number; w: number }[]
  butterflies: Butterfly[]
  flowers: Flower[]
  farmerBob: number
  sunAngle: number
}

const CANVAS_MAX_W = 600
const GROUND_TOP = CANVAS_H - 40

export default function CountingGame() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { lang, t } = useLanguage()
  const mario = useMarioGame()
  const autoCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [level, setLevel] = useState(1)
  const maxCount = Math.min(5 + level * 2, 20)
  const [problem, setProblem] = useState(() => generateProblem(maxCount))
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showTryAgain, setShowTryAgain] = useState(false)

  const { canvasRef, canvasWidth, handleInteract } = useArcadeCanvas<GardenState>({
    init: () => {
      const clouds: { x: number; y: number; w: number }[] = []
      for (let i = 0; i < 5; i++) clouds.push({ x: Math.random() * CANVAS_MAX_W * 2, y: 15 + Math.random() * 50, w: 40 + Math.random() * 50 })
      const butterflies: Butterfly[] = []
      const bColors = ['#EC4899', '#A855F7', '#3B82F6', '#EAB308', '#F97316']
      for (let i = 0; i < 6; i++) {
        butterflies.push({
          x: Math.random() * CANVAS_MAX_W, y: 60 + Math.random() * 120,
          wingPhase: Math.random() * Math.PI * 2, color: bColors[i % bColors.length],
          dx: (Math.random() - 0.5) * 1.5, dy: (Math.random() - 0.5) * 0.8,
        })
      }
      const flowers: Flower[] = []
      for (let i = 0; i < 12; i++) flowers.push({ x: 20 + i * 50 + Math.random() * 30, type: Math.floor(Math.random() * 3), swayPhase: Math.random() * Math.PI * 2 })
      return { runTimer: 0, clouds, butterflies, flowers, farmerBob: 0, sunAngle: 0 }
    },

    update: (g, cw) => {
      g.runTimer++
      g.farmerBob = Math.sin(g.runTimer * 0.05) * 2
      g.sunAngle += 0.002

      for (const c of g.clouds) {
        c.x -= 0.3
        if (c.x + c.w < 0) { c.x = cw + Math.random() * 200; c.y = 15 + Math.random() * 50 }
      }

      for (const b of g.butterflies) {
        b.wingPhase += 0.15
        b.x += b.dx
        b.y += b.dy + Math.sin(b.wingPhase * 0.3) * 0.5
        if (b.x < -10 || b.x > cw + 10) b.dx *= -1
        if (b.y < 30 || b.y > GROUND_TOP - 30) b.dy *= -1
      }
    },

    draw: (ctx, g, cw) => {
      // Garden sky
      drawSkyGradient(ctx, cw, '#87CEEB', '#E0F7FA')

      // Sun
      ctx.fillStyle = '#FFE066'
      ctx.beginPath()
      ctx.arc(cw - 50, 40, 25, 0, Math.PI * 2)
      ctx.fill()
      // Sun rays
      ctx.save()
      ctx.globalAlpha = 0.15
      ctx.strokeStyle = '#FFE066'
      ctx.lineWidth = 2
      for (let i = 0; i < 8; i++) {
        const a = g.sunAngle + (i / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cw - 50 + Math.cos(a) * 28, 40 + Math.sin(a) * 28)
        ctx.lineTo(cw - 50 + Math.cos(a) * 40, 40 + Math.sin(a) * 40)
        ctx.stroke()
      }
      ctx.restore()

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      for (const c of g.clouds) drawCloud(ctx, c.x, c.y, c.w)

      // Garden fence in background
      ctx.fillStyle = '#D4A76A'
      for (let x = 0; x < cw; x += 40) {
        ctx.fillRect(x + 10, GROUND_TOP - 35, 5, 35)
      }
      ctx.fillRect(0, GROUND_TOP - 25, cw, 4)
      ctx.fillRect(0, GROUND_TOP - 12, cw, 4)

      // Flowers
      const flowerColors = ['#EF4444', '#EC4899', '#A855F7']
      for (const f of g.flowers) {
        const sway = Math.sin(g.runTimer * 0.03 + f.swayPhase) * 3
        const fx = f.x
        // Stem
        ctx.strokeStyle = '#22C55E'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(fx, GROUND_TOP)
        ctx.quadraticCurveTo(fx + sway, GROUND_TOP - 20, fx + sway * 0.5, GROUND_TOP - 35)
        ctx.stroke()
        // Flower head
        ctx.fillStyle = flowerColors[f.type]
        const fhx = fx + sway * 0.5
        const fhy = GROUND_TOP - 35
        for (let p = 0; p < 5; p++) {
          const pa = (p / 5) * Math.PI * 2
          ctx.beginPath()
          ctx.arc(fhx + Math.cos(pa) * 5, fhy + Math.sin(pa) * 5, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = '#FFD93D'
        ctx.beginPath()
        ctx.arc(fhx, fhy, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Ground (garden soil + grass)
      drawGround(ctx, cw, '#8B6914', '#4CAF50')

      // Butterflies
      for (const b of g.butterflies) {
        ctx.fillStyle = b.color
        const wingSpread = Math.abs(Math.sin(b.wingPhase)) * 6
        // Left wing
        ctx.beginPath()
        ctx.ellipse(b.x - wingSpread, b.y, wingSpread + 2, 4, -0.3, 0, Math.PI * 2)
        ctx.fill()
        // Right wing
        ctx.beginPath()
        ctx.ellipse(b.x + wingSpread, b.y, wingSpread + 2, 4, 0.3, 0, Math.PI * 2)
        ctx.fill()
        // Body
        ctx.fillStyle = '#333'
        ctx.fillRect(b.x - 1, b.y - 3, 2, 6)
      }

      // Farmer character (standing in garden)
      const fx = 50
      const fy = GROUND_TOP - 42 + g.farmerBob
      // Body
      ctx.fillStyle = '#1565C0'
      ctx.fillRect(fx - 8, fy + 22, 16, 14)
      // Head
      ctx.fillStyle = '#FFCC80'
      ctx.beginPath()
      ctx.arc(fx, fy + 14, 8, 0, Math.PI * 2)
      ctx.fill()
      // Hat (straw hat)
      ctx.fillStyle = '#F5DEB3'
      ctx.fillRect(fx - 12, fy + 4, 24, 4)
      ctx.fillRect(fx - 6, fy - 2, 12, 8)
      // Eyes
      ctx.fillStyle = '#000'
      ctx.fillRect(fx - 3, fy + 12, 2, 2)
      ctx.fillRect(fx + 1, fy + 12, 2, 2)
      // Legs
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(fx - 6, fy + 36, 5, 6)
      ctx.fillRect(fx + 1, fy + 36, 5, 6)
    },

    onInteract: (g) => {
      // Tap butterflies (cosmetic scatter)
      for (const b of g.butterflies) {
        b.dx = (Math.random() - 0.5) * 3
        b.dy = -Math.random() * 2
      }
    },
  })

  const checkAnswer = useCallback((answer: string) => {
    if (answer === '') return
    const parsed = parseInt(answer, 10)
    if (parsed === problem.count) {
      setFeedback(mario.onCorrect(lang))
      setShowTryAgain(false)
      if (mario.coins > 0 && mario.coins % 3 === 0) setLevel(l => l + 1)
      setTimeout(() => {
        setFeedback(null)
        setProblem(generateProblem(maxCount))
        setUserAnswer('')
        inputRef.current?.focus()
      }, 1200)
    } else {
      mario.onWrong()
      setShowTryAgain(true)
      setFeedback(t('countAgain'))
      setUserAnswer('')
      inputRef.current?.focus()
    }
  }, [problem.count, mario, maxCount])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUserAnswer(value)
    if (autoCheckRef.current) clearTimeout(autoCheckRef.current)
    if (value !== '') autoCheckRef.current = setTimeout(() => checkAnswer(value), 3000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (autoCheckRef.current) clearTimeout(autoCheckRef.current)
    checkAnswer(userAnswer)
  }

  useEffect(() => {
    return () => { if (autoCheckRef.current) clearTimeout(autoCheckRef.current) }
  }, [])

  return (
    <GameLayout>
      <GameHeader title={t('game.counting.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={() => { mario.resetGame(); setLevel(1); setProblem(generateProblem(7)); setUserAnswer(''); setFeedback(null); setShowTryAgain(false) }} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl relative">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          onClick={handleInteract}
          onTouchStart={(e) => { e.preventDefault(); handleInteract() }}
          className="rounded-2xl border-4 border-green-500 shadow-[0_8px_0_rgba(34,197,94,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {/* Counting overlay on canvas */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="mario-question-block border-4 rounded-2xl p-4 sm:p-6 text-center max-w-xs w-full mx-4 pointer-events-auto">
            <p className="text-sm font-bold text-white/70 mb-2">{t('counting.howMany').replace('{emoji}', problem.emoji)}</p>

            <div className="flex flex-wrap justify-center gap-2 mb-3 max-w-[260px] mx-auto">
              {Array.from({ length: problem.count }).map((_, i) => (
                <span key={i} className="text-3xl sm:text-4xl">{problem.emoji}</span>
              ))}
            </div>

            {feedback && (
              <p className={`text-xl font-bold mb-2 ${showTryAgain ? 'text-red-500' : 'text-green-600'}`}>{feedback}</p>
            )}

            {(!feedback || showTryAgain) && (
              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
                <input ref={inputRef} type="number" value={userAnswer} onChange={handleChange}
                  className="w-24 text-center text-3xl font-bold border-4 border-blue-300 rounded-2xl px-3 py-2 focus:outline-none focus:border-blue-500 text-black"
                  placeholder="" autoFocus />
              </form>
            )}
          </div>
        </div>

        <p className="text-white/60 text-sm text-center">{t('counting.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
