'use client'

import { useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawFeedbackText, drawGear, GATE_SPACING } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { useLanguage } from '@/lib/i18n'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'

// ---- Shape data (same educational content) ----

const SHAPES = [
  { name: 'Circle', color: '#EF4444' },
  { name: 'Square', color: '#3B82F6' },
  { name: 'Triangle', color: '#22C55E' },
  { name: 'Star', color: '#EAB308' },
  { name: 'Diamond', color: '#A855F7' },
  { name: 'Heart', color: '#EC4899' },
]

interface Problem { shape: typeof SHAPES[0]; choices: string[] }

let lastShapeIndex = -1

function generateProblem(): Problem {
  let idx = Math.floor(Math.random() * SHAPES.length)
  if (idx === lastShapeIndex) idx = (idx + 1) % SHAPES.length
  lastShapeIndex = idx
  const shape = SHAPES[idx]
  const others = SHAPES.filter(s => s.name !== shape.name).sort(() => Math.random() - 0.5).slice(0, 3)
  const choices = [...others.map(s => s.name), shape.name].sort(() => Math.random() - 0.5)
  return { shape, choices }
}

function drawShape(ctx: CanvasRenderingContext2D, name: string, cx: number, cy: number, size: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  switch (name) {
    case 'Circle':
      ctx.arc(cx, cy, size, 0, Math.PI * 2)
      break
    case 'Square':
      ctx.rect(cx - size, cy - size, size * 2, size * 2)
      break
    case 'Triangle':
      ctx.moveTo(cx, cy - size)
      ctx.lineTo(cx + size, cy + size)
      ctx.lineTo(cx - size, cy + size)
      ctx.closePath()
      break
    case 'Star': {
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const method = i === 0 ? 'moveTo' : 'lineTo'
        ctx[method](cx + Math.cos(angle) * size, cy + Math.sin(angle) * size)
      }
      ctx.closePath()
      break
    }
    case 'Diamond':
      ctx.moveTo(cx, cy - size)
      ctx.lineTo(cx + size * 0.7, cy)
      ctx.lineTo(cx, cy + size)
      ctx.lineTo(cx - size * 0.7, cy)
      ctx.closePath()
      break
    case 'Heart': {
      const s = size * 0.6
      ctx.moveTo(cx, cy + s)
      ctx.bezierCurveTo(cx - s * 2, cy - s * 0.5, cx - s * 0.5, cy - s * 2, cx, cy - s * 0.8)
      ctx.bezierCurveTo(cx + s * 0.5, cy - s * 2, cx + s * 2, cy - s * 0.5, cx, cy + s)
      break
    }
  }
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.stroke()
}

// ---- Canvas state ----

interface ConveyorShape { x: number; shapeName: string; color: string }

interface GameState {
  scrollX: number; speed: number; nextGateX: number
  conveyorShapes: ConveyorShape[]
  gearAngle: number
  decCoins: { x: number; y: number; collected: boolean }[]
  runTimer: number; flashTimer: number
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
  robotArmY: number; robotArmTarget: number
  pistonPhase: number
}

const CANVAS_MAX_W = 600
const BELT_Y = 200
const BELT_H = 30

function generateDecCoins(fromX: number, toX: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cx = fromX + 60; cx < toX - 60; cx += 80) {
    if (Math.random() < 0.4) {
      coins.push({ x: cx, y: BELT_Y - 50 - Math.random() * 30, collected: false })
    }
  }
  return coins
}

export default function ShapeBuilderGame() {
  const router = useRouter()
  const mario = useMarioGame()
  const { lang, t } = useLanguage()
  const coinsRef = useRef(0)
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null)
  const [cardFeedback, setCardFeedback] = useState<{ text: string; correct: boolean } | null>(null)

  coinsRef.current = mario.coins
  const setActiveProblemRef = useRef(setActiveProblem)
  setActiveProblemRef.current = setActiveProblem
  const setCardFeedbackRef = useRef(setCardFeedback)
  setCardFeedbackRef.current = setCardFeedback

  const { canvasRef, stateRef, canvasWidth, handleInteract, resetState } = useArcadeCanvas<GameState>({
    init: () => {
      const conveyorShapes: ConveyorShape[] = []
      for (let i = 0; i < 6; i++) {
        const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]
        conveyorShapes.push({ x: 100 + i * 150, shapeName: s.name, color: s.color })
      }
      return {
        scrollX: 0, speed: 1.5, nextGateX: GATE_SPACING + 150,
        conveyorShapes, gearAngle: 0,
        decCoins: generateDecCoins(100, GATE_SPACING + 150),
        runTimer: 0, flashTimer: 0,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false,
        robotArmY: 60, robotArmTarget: 60,
        pistonPhase: 0,
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--
      g.runTimer++
      g.gearAngle += g.paused ? 0.005 : 0.03
      g.pistonPhase += g.paused ? 0.01 : 0.05
      g.robotArmY += (g.robotArmTarget - g.robotArmY) * 0.08

      if (g.paused) return

      g.scrollX += g.speed

      // Move conveyor shapes
      for (const cs of g.conveyorShapes) {
        const sx = cs.x - g.scrollX
        if (sx < -50) {
          cs.x += cw + 200 + Math.random() * 100
          const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]
          cs.shapeName = s.name
          cs.color = s.color
        }
      }

      // Coin collection (robot arm area)
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sx = dc.x - g.scrollX
        if (sx > 60 && sx < 120 && Math.abs(dc.y - g.robotArmY) < 30) dc.collected = true
      }

      // Gate check
      const gateScreenX = g.nextGateX - g.scrollX
      if (gateScreenX <= 140) {
        g.paused = true
        g.robotArmTarget = BELT_Y - 30
        setActiveProblemRef.current(generateProblem())
        setCardFeedbackRef.current(null)
      }

      g.decCoins = g.decCoins.filter(dc => dc.x - g.scrollX > -100)
    },

    draw: (ctx, g, cw) => {
      // Factory background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#4A4A5A')
      grad.addColorStop(1, '#2A2A3A')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Factory wall details (rivets, pipes)
      ctx.fillStyle = '#555568'
      for (let i = 0; i < 8; i++) {
        ctx.beginPath()
        ctx.arc(40 + i * 80, 25, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      // Pipe
      ctx.fillStyle = '#666'
      ctx.fillRect(0, 40, cw, 8)
      ctx.fillStyle = '#777'
      ctx.fillRect(0, 40, cw, 3)

      // Gears
      drawGear(ctx, 50, 90, 25, g.gearAngle, '#888')
      drawGear(ctx, cw - 50, 90, 20, -g.gearAngle * 1.2, '#999')

      // Pistons
      const pistonY = 70 + Math.sin(g.pistonPhase) * 15
      ctx.fillStyle = '#AAA'
      ctx.fillRect(cw / 2 - 60, pistonY, 8, 30)
      ctx.fillRect(cw / 2 + 52, pistonY, 8, 30)
      ctx.fillStyle = '#888'
      ctx.fillRect(cw / 2 - 62, pistonY + 28, 12, 6)
      ctx.fillRect(cw / 2 + 50, pistonY + 28, 12, 6)

      // Conveyor belt
      ctx.fillStyle = '#555'
      ctx.fillRect(0, BELT_Y, cw, BELT_H)
      ctx.fillStyle = '#444'
      // Belt stripes
      const stripeOffset = (g.scrollX * 2) % 20
      for (let x = -20 + stripeOffset; x < cw + 20; x += 20) {
        ctx.fillRect(x, BELT_Y, 10, BELT_H)
      }
      // Belt edges
      ctx.fillStyle = '#666'
      ctx.fillRect(0, BELT_Y, cw, 3)
      ctx.fillRect(0, BELT_Y + BELT_H - 3, cw, 3)
      // Belt rollers
      ctx.fillStyle = '#777'
      ctx.beginPath()
      ctx.arc(20, BELT_Y + BELT_H / 2, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cw - 20, BELT_Y + BELT_H / 2, 10, 0, Math.PI * 2)
      ctx.fill()

      // Shapes on conveyor
      for (const cs of g.conveyorShapes) {
        const sx = cs.x - g.scrollX
        if (sx < -40 || sx > cw + 40) continue
        drawShape(ctx, cs.shapeName, sx, BELT_Y - 18, 14, cs.color)
      }

      // Decorative coins
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sx = dc.x - g.scrollX
        if (sx < -20 || sx > cw + 20) continue
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(sx, dc.y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#DAA520'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Gate marker on belt
      if (!g.paused) {
        const gx = g.nextGateX - g.scrollX
        if (gx > 0 && gx < cw + 100) {
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(gx - 20, BELT_Y - 60, 40, 60)
          ctx.strokeStyle = '#B8860B'
          ctx.lineWidth = 2
          ctx.strokeRect(gx - 20, BELT_Y - 60, 40, 60)
          ctx.fillStyle = '#B8860B'
          ctx.font = 'bold 20px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', gx, BELT_Y - 30)
        }
      }

      // Robot arm
      const armX = 90
      ctx.fillStyle = '#BBB'
      ctx.fillRect(armX - 3, 0, 6, g.robotArmY)
      // Claw
      ctx.fillStyle = '#DDD'
      ctx.fillRect(armX - 12, g.robotArmY, 24, 8)
      ctx.fillRect(armX - 14, g.robotArmY + 6, 4, 10)
      ctx.fillRect(armX + 10, g.robotArmY + 6, 4, 10)
      // Rail at top
      ctx.fillStyle = '#999'
      ctx.fillRect(0, 0, cw, 8)

      // Floor
      ctx.fillStyle = '#383848'
      ctx.fillRect(0, BELT_Y + BELT_H + 20, cw, CANVAS_H - BELT_Y - BELT_H - 20)
      // Floor line
      ctx.fillStyle = '#FFD93D'
      ctx.fillRect(0, BELT_Y + BELT_H + 20, cw, 3)

      // Feedback
      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      if (!g.paused) {
        // Make robot arm bob
        g.robotArmTarget = g.robotArmTarget === 60 ? 100 : 60
      }
    },
  })

  const handleChoice = useCallback((choice: string) => {
    if (!activeProblem) return
    const g = stateRef.current
    if (!g) return

    if (choice === activeProblem.shape.name) {
      const cheer = mario.onCorrect(lang)
      setCardFeedback({ text: cheer, correct: true })
      g.feedbackText = cheer
      g.feedbackColor = '#22C55E'
      g.feedbackTimer = 70
      g.robotArmTarget = 60

      setTimeout(() => {
        setActiveProblem(null)
        setCardFeedback(null)
        const gs = stateRef.current
        if (gs) {
          gs.paused = false
          const prev = gs.nextGateX
          gs.nextGateX = prev + GATE_SPACING
          gs.decCoins.push(...generateDecCoins(prev + 60, prev + GATE_SPACING - 60))
        }
      }, 1200)
    } else {
      mario.onWrong()
      setCardFeedback({ text: t('tryAnother'), correct: false })
      g.feedbackText = 'Oops!'
      g.feedbackColor = '#EF4444'
      g.feedbackTimer = 50
      g.flashTimer = 60
      setTimeout(() => setCardFeedback(null), 1000)
    }
  }, [activeProblem, mario, stateRef, lang, t])

  const handleReset = useCallback(() => {
    mario.resetGame()
    resetState()
    setActiveProblem(null)
    setCardFeedback(null)
  }, [mario, resetState])

  return (
    <GameLayout>
      <GameHeader title={t('game.shapes.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={handleReset} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl relative">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          onClick={handleInteract}
          onTouchStart={(e) => { e.preventDefault(); handleInteract() }}
          className="rounded-2xl border-4 border-purple-500 shadow-[0_8px_0_rgba(168,85,247,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {activeProblem && !mario.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
            <div className="mario-question-block border-4 rounded-2xl p-6 sm:p-8 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-lg font-bold text-white/70 mb-2">{t('shapes.prompt')}</p>

              {/* Shape display */}
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-lg">
                  {activeProblem.shape.name === 'Circle' && <circle cx="50" cy="50" r="40" fill={activeProblem.shape.color} stroke="white" strokeWidth="2" />}
                  {activeProblem.shape.name === 'Square' && <rect x="10" y="10" width="80" height="80" fill={activeProblem.shape.color} stroke="white" strokeWidth="2" />}
                  {activeProblem.shape.name === 'Triangle' && <polygon points="50,10 90,90 10,90" fill={activeProblem.shape.color} stroke="white" strokeWidth="2" />}
                  {activeProblem.shape.name === 'Star' && <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={activeProblem.shape.color} stroke="white" strokeWidth="2" />}
                  {activeProblem.shape.name === 'Diamond' && <polygon points="50,5 95,50 50,95 5,50" fill={activeProblem.shape.color} stroke="white" strokeWidth="2" />}
                  {activeProblem.shape.name === 'Heart' && <path d="M50,85 C20,60 5,40 15,25 C25,10 40,15 50,30 C60,15 75,10 85,25 C95,40 80,60 50,85Z" fill={activeProblem.shape.color} stroke="white" strokeWidth="2" />}
                </svg>
              </div>

              {cardFeedback && (
                <p className={`text-xl font-bold mb-3 ${cardFeedback.correct ? 'text-green-600' : 'text-red-500'}`}>{cardFeedback.text}</p>
              )}

              {(!cardFeedback || !cardFeedback.correct) && (
                <div className="grid grid-cols-2 gap-3">
                  {activeProblem.choices.map((c) => (
                    <button key={c} onClick={() => handleChoice(c)}
                      className="px-4 py-3 rounded-xl bg-[#5B8DEF] hover:bg-[#4A7DE0] active:scale-95 border-2 border-white/50 shadow-[0_3px_0_rgba(0,0,0,0.2)] text-white text-lg font-black transition-all"
                      style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>{t('shape.' + c)}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('shapes.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
