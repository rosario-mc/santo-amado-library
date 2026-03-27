'use client'

import { useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import {
  drawStars, drawFeedbackText, drawGateMarker, drawDecorativeCoins,
  CHAR_GROUND_Y, GATE_SPACING, GRAVITY, JUMP_FORCE, CHAR_W, CHAR_H,
} from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

// ---- Problem generation (same educational content) ----

const ADDITION_ICONS = ['🚀', '⭐', '🪐', '☄️', '🛸', '🌙']

interface Problem { a: number; b: number; answer: number; choices: number[]; icon: string }

let lastProblemKey = ''

function generateProblem(): Problem {
  let a: number, b: number, answer: number
  let attempts = 0
  do {
    a = Math.floor(Math.random() * 6) + 1
    b = Math.floor(Math.random() * 6) + 1
    answer = a + b
    attempts++
  } while (`${a}+${b}` === lastProblemKey && attempts < 10)
  lastProblemKey = `${a}+${b}`
  const icon = ADDITION_ICONS[Math.floor(Math.random() * ADDITION_ICONS.length)]
  const choices = [answer]
  while (choices.length < 2) {
    const off = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1)
    const w = answer + off
    if (w > 0 && !choices.includes(w)) choices.push(w)
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { a, b, answer, choices, icon }
}

// ---- Canvas state ----

interface Star { x: number; y: number; r: number; twinkle: number }
interface Asteroid { x: number; y: number; size: number; angle: number }

interface GameState {
  rocketY: number; rocketVY: number; isThrusting: boolean
  scrollY: number; speed: number
  nextGateY: number
  stars: Star[]
  asteroids: Asteroid[]
  decCoins: { x: number; y: number; collected: boolean }[]
  runFrame: number; runTimer: number; flashTimer: number
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
  rocketX: number; targetRocketX: number
  flameFrame: number
}

const CANVAS_MAX_W = 600
const GROUND_H = 0
const ROCKET_W = 30
const ROCKET_H = 44
const ROCKET_BASE_X = 285

function generateDecCoins(fromY: number, toY: number, cw: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cy = fromY + 60; cy < toY - 60; cy += 80) {
    if (Math.random() < 0.5) {
      coins.push({ x: 40 + Math.random() * (cw - 80), y: cy, collected: false })
    }
  }
  return coins
}

export default function AdditionGame() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const mario = useMarioGame()
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
      const stars: Star[] = []
      for (let i = 0; i < 60; i++) {
        stars.push({ x: Math.random() * CANVAS_MAX_W, y: Math.random() * CANVAS_H * 3, r: 0.5 + Math.random() * 2, twinkle: Math.random() * Math.PI * 2 })
      }
      const asteroids: Asteroid[] = []
      for (let i = 0; i < 4; i++) {
        asteroids.push({ x: Math.random() * CANVAS_MAX_W, y: -Math.random() * CANVAS_H * 2, size: 8 + Math.random() * 14, angle: Math.random() * Math.PI * 2 })
      }
      return {
        rocketY: CANVAS_H / 2, rocketVY: 0, isThrusting: false,
        scrollY: 0, speed: 1.5,
        nextGateY: GATE_SPACING + 150,
        stars, asteroids,
        decCoins: generateDecCoins(100, GATE_SPACING + 150, CANVAS_MAX_W),
        runFrame: 0, runTimer: 0, flashTimer: 0,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false,
        rocketX: ROCKET_BASE_X, targetRocketX: ROCKET_BASE_X,
        flameFrame: 0,
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--
      g.flameFrame++

      for (const s of g.stars) s.twinkle += 0.03

      if (g.paused) {
        g.runTimer++
        return
      }

      g.scrollY += g.speed

      // Rocket sway
      g.rocketX += (g.targetRocketX - g.rocketX) * 0.05
      if (Math.random() < 0.02) g.targetRocketX = (cw / 2 - 40) + Math.random() * 80

      // Stars scroll down
      for (const s of g.stars) {
        s.y += g.speed * 0.3
        if (s.y > CANVAS_H + 10) { s.y = -10; s.x = Math.random() * cw }
      }

      // Asteroids scroll down
      for (const a of g.asteroids) {
        a.y += g.speed * 1.5
        a.angle += 0.02
        if (a.y > CANVAS_H + 30) {
          a.y = -30 - Math.random() * 200
          a.x = Math.random() * cw
        }
      }

      // Coin collection
      const rocketCX = g.rocketX + ROCKET_W / 2
      const rocketCY = CANVAS_H * 0.35
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const dcScreenY = dc.y - g.scrollY + CANVAS_H
        const dx = rocketCX - dc.x
        const dy = rocketCY - dcScreenY
        if (Math.sqrt(dx * dx + dy * dy) < 22) dc.collected = true
      }

      // Gate check
      const gateScreenY = g.nextGateY - g.scrollY
      if (gateScreenY <= CANVAS_H * 0.5) {
        g.paused = true
        setActiveProblemRef.current(generateProblem())
        setCardFeedbackRef.current(null)
      }

      g.decCoins = g.decCoins.filter(dc => dc.y - g.scrollY + CANVAS_H > -50)
    },

    draw: (ctx, g, cw) => {
      // Deep space gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#0B0B2B')
      grad.addColorStop(0.5, '#1A1A4E')
      grad.addColorStop(1, '#0D0D35')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Stars
      drawStars(ctx, g.stars, cw)

      // Asteroids
      for (const a of g.asteroids) {
        ctx.save()
        ctx.translate(a.x, a.y)
        ctx.rotate(a.angle)
        ctx.fillStyle = '#6B5B4F'
        ctx.beginPath()
        ctx.ellipse(0, 0, a.size, a.size * 0.7, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#5A4A3F'
        ctx.beginPath()
        ctx.arc(-a.size * 0.3, -a.size * 0.2, a.size * 0.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Decorative coins
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sy = dc.y - g.scrollY + CANVAS_H
        if (sy < -20 || sy > CANVAS_H + 20) continue
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(dc.x, sy, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#DAA520'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Gate marker (horizontal bar across screen)
      if (!g.paused) {
        const gy = g.nextGateY - g.scrollY + CANVAS_H
        if (gy > -50 && gy < CANVAS_H + 100) {
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(0, gy - 3, cw, 6)
          ctx.fillStyle = '#B8860B'
          ctx.font = 'bold 22px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', cw / 2, gy - 18)

          // Question block at center
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(cw / 2 - 18, gy - 36, 36, 30)
          ctx.strokeStyle = '#B8860B'
          ctx.lineWidth = 2
          ctx.strokeRect(cw / 2 - 18, gy - 36, 36, 30)
        }
      }

      // Rocket
      const rx = g.rocketX
      const ry = CANVAS_H * 0.35
      const showRocket = g.flashTimer <= 0 || Math.floor(g.flashTimer / 4) % 2 === 0
      if (showRocket) {
        // Flame
        const flicker = Math.sin(g.flameFrame * 0.5) * 3
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        ctx.moveTo(rx + 5, ry + ROCKET_H)
        ctx.lineTo(rx + ROCKET_W / 2, ry + ROCKET_H + 18 + flicker)
        ctx.lineTo(rx + ROCKET_W - 5, ry + ROCKET_H)
        ctx.fill()
        ctx.fillStyle = '#FFD93D'
        ctx.beginPath()
        ctx.moveTo(rx + 10, ry + ROCKET_H)
        ctx.lineTo(rx + ROCKET_W / 2, ry + ROCKET_H + 10 + flicker * 0.5)
        ctx.lineTo(rx + ROCKET_W - 10, ry + ROCKET_H)
        ctx.fill()

        // Body
        ctx.fillStyle = '#E8E8E8'
        ctx.beginPath()
        ctx.moveTo(rx + ROCKET_W / 2, ry)
        ctx.lineTo(rx + ROCKET_W, ry + 14)
        ctx.lineTo(rx + ROCKET_W, ry + ROCKET_H)
        ctx.lineTo(rx, ry + ROCKET_H)
        ctx.lineTo(rx, ry + 14)
        ctx.closePath()
        ctx.fill()

        // Nose cone
        ctx.fillStyle = '#EF4444'
        ctx.beginPath()
        ctx.moveTo(rx + ROCKET_W / 2, ry - 6)
        ctx.lineTo(rx + ROCKET_W - 2, ry + 10)
        ctx.lineTo(rx + 2, ry + 10)
        ctx.closePath()
        ctx.fill()

        // Window
        ctx.fillStyle = '#60A5FA'
        ctx.beginPath()
        ctx.arc(rx + ROCKET_W / 2, ry + 22, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#93C5FD'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Fins
        ctx.fillStyle = '#EF4444'
        ctx.beginPath()
        ctx.moveTo(rx, ry + ROCKET_H - 8)
        ctx.lineTo(rx - 6, ry + ROCKET_H + 2)
        ctx.lineTo(rx, ry + ROCKET_H)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(rx + ROCKET_W, ry + ROCKET_H - 8)
        ctx.lineTo(rx + ROCKET_W + 6, ry + ROCKET_H + 2)
        ctx.lineTo(rx + ROCKET_W, ry + ROCKET_H)
        ctx.fill()
      }

      // Feedback
      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      if (g.paused) return
      // Small lateral nudge on tap (cosmetic)
      g.targetRocketX = g.rocketX + (Math.random() < 0.5 ? -30 : 30)
    },
  })

  const handleAnswer = useCallback((value: number) => {
    if (!activeProblem) return
    const g = stateRef.current
    if (!g) return

    if (value === activeProblem.answer) {
      const cheer = mario.onCorrect(lang)
      setCardFeedback({ text: cheer, correct: true })
      g.feedbackText = cheer
      g.feedbackColor = '#22C55E'
      g.feedbackTimer = 70
    } else {
      mario.onWrong()
      setCardFeedback({ text: t('tryAgain'), correct: false })
      g.feedbackText = 'Oops! 💪'
      g.feedbackColor = '#EF4444'
      g.feedbackTimer = 70
      g.flashTimer = 90
      return
    }

    setTimeout(() => {
      setActiveProblem(null)
      setCardFeedback(null)
      const gs = stateRef.current
      if (gs) {
        gs.paused = false
        const prev = gs.nextGateY
        gs.nextGateY = prev + GATE_SPACING
        gs.decCoins.push(...generateDecCoins(prev + 60, prev + GATE_SPACING - 60, CANVAS_MAX_W))
      }
    }, 1200)
  }, [activeProblem, mario, stateRef])

  const handleReset = useCallback(() => {
    mario.resetGame()
    resetState()
    setActiveProblem(null)
    setCardFeedback(null)
  }, [mario, resetState])

  return (
    <GameLayout>
      <GameHeader title={t('game.addition.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={handleReset} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl relative">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          onClick={handleInteract}
          onTouchStart={(e) => { e.preventDefault(); handleInteract() }}
          className="rounded-2xl border-4 border-red-500 shadow-[0_8px_0_rgba(239,68,68,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {activeProblem && !mario.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
            <div className="mario-question-block border-4 rounded-2xl p-6 sm:p-8 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-lg font-bold text-white/70 mb-2">{t('whatIs')}</p>

              {/* Visual counting icons */}
              <div className="flex flex-wrap justify-center gap-1 mb-1">
                {Array.from({ length: activeProblem.a }).map((_, i) => (
                  <span key={`a-${i}`} className="text-2xl">{activeProblem.icon}</span>
                ))}
              </div>
              <p className="text-xl font-black text-white mb-1">+</p>
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                {Array.from({ length: activeProblem.b }).map((_, i) => (
                  <span key={`b-${i}`} className="text-2xl">{activeProblem.icon}</span>
                ))}
              </div>

              <p className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>
                {activeProblem.a} + {activeProblem.b} = ?
              </p>
              {cardFeedback && (
                <p className={`text-xl font-bold mb-4 ${cardFeedback.correct ? 'text-green-600' : 'text-red-500'}`}>{cardFeedback.text}</p>
              )}
              {(!cardFeedback || !cardFeedback.correct) && (
                <div className="flex gap-4 justify-center flex-wrap">
                  {activeProblem.choices.map((c) => (
                    <button key={c} onClick={() => handleAnswer(c)}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#5B8DEF] hover:bg-[#4A7DE0] active:scale-95 border-4 border-white/50 shadow-[0_4px_0_rgba(0,0,0,0.2)] text-white text-3xl sm:text-4xl font-black transition-all"
                      style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('addition.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
