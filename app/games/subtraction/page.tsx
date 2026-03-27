'use client'

import { useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawBubbles, drawWaves, drawFeedbackText, GATE_SPACING } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

// ---- Problem generation (subtraction, same educational content) ----

const SUBTRACTION_ICONS = ['🐟', '🐚', '🦀', '🐙', '🪸', '🫧']

interface Problem { a: number; b: number; answer: number; choices: number[]; icon: string }

let lastProblemKey = ''

function generateProblem(): Problem {
  let a: number, b: number, answer: number
  let attempts = 0
  do {
    a = Math.floor(Math.random() * 10) + 1
    b = Math.floor(Math.random() * a) + 1
    answer = a - b
    attempts++
  } while (`${a}-${b}` === lastProblemKey && attempts < 10)
  lastProblemKey = `${a}-${b}`
  const icon = SUBTRACTION_ICONS[Math.floor(Math.random() * SUBTRACTION_ICONS.length)]
  const choices = [answer]
  while (choices.length < 2) {
    const off = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1)
    const w = answer + off
    if (w >= 0 && !choices.includes(w)) choices.push(w)
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { a, b, answer, choices, icon }
}

// ---- Canvas state ----

interface Bubble { x: number; y: number; r: number; speed: number }
interface Fish { x: number; y: number; dir: number; color: string; size: number }
interface Seaweed { x: number; h: number; phase: number }

interface GameState {
  scrollY: number; speed: number; nextGateY: number
  subX: number; subBob: number
  bubbles: Bubble[]
  fish: Fish[]
  seaweed: Seaweed[]
  decCoins: { x: number; y: number; collected: boolean }[]
  runFrame: number; runTimer: number; flashTimer: number
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
  depthColor: number
}

const CANVAS_MAX_W = 600
const SUB_W = 50
const SUB_H = 26

function generateDecCoins(fromY: number, toY: number, cw: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cy = fromY + 60; cy < toY - 60; cy += 80) {
    if (Math.random() < 0.5) {
      coins.push({ x: 40 + Math.random() * (cw - 80), y: cy, collected: false })
    }
  }
  return coins
}

export default function SubtractionGame() {
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
      const bubbles: Bubble[] = []
      for (let i = 0; i < 15; i++) {
        bubbles.push({ x: Math.random() * CANVAS_MAX_W, y: Math.random() * CANVAS_H, r: 2 + Math.random() * 5, speed: 0.3 + Math.random() * 0.7 })
      }
      const fish: Fish[] = []
      const fishColors = ['#FF6B6B', '#FFD93D', '#4ECDC4', '#FF8C42', '#A8E6CF']
      for (let i = 0; i < 5; i++) {
        fish.push({ x: Math.random() * CANVAS_MAX_W * 2, y: 40 + Math.random() * (CANVAS_H - 80), dir: Math.random() < 0.5 ? -1 : 1, color: fishColors[i % fishColors.length], size: 10 + Math.random() * 8 })
      }
      const seaweed: Seaweed[] = []
      for (let i = 0; i < 8; i++) {
        seaweed.push({ x: Math.random() * CANVAS_MAX_W, h: 30 + Math.random() * 50, phase: Math.random() * Math.PI * 2 })
      }
      return {
        scrollY: 0, speed: 1.5, nextGateY: GATE_SPACING + 150,
        subX: CANVAS_MAX_W / 2 - SUB_W / 2, subBob: 0,
        bubbles, fish, seaweed,
        decCoins: generateDecCoins(100, GATE_SPACING + 150, CANVAS_MAX_W),
        runFrame: 0, runTimer: 0, flashTimer: 0,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false, depthColor: 0,
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--
      g.runTimer++
      g.subBob = Math.sin(g.runTimer * 0.04) * 4

      // Bubbles always drift up
      for (const b of g.bubbles) {
        b.y -= b.speed
        b.x += Math.sin(g.runTimer * 0.02 + b.x) * 0.3
        if (b.y < -10) { b.y = CANVAS_H + 10; b.x = Math.random() * cw }
      }

      if (g.paused) return

      g.scrollY += g.speed
      g.depthColor = Math.min(1, g.scrollY / 3000)

      // Fish swim
      for (const f of g.fish) {
        f.x += f.dir * 0.8
        if (f.x > cw + 30) { f.x = -30; f.dir = 1 }
        if (f.x < -30) { f.x = cw + 30; f.dir = -1 }
      }

      // Coin collection
      const subCX = g.subX + SUB_W / 2
      const subCY = CANVAS_H * 0.4 + g.subBob
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sy = dc.y - g.scrollY + CANVAS_H
        const dx = subCX - dc.x
        const dy = subCY - sy
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
      // Ocean gradient (gets darker as you go deeper)
      const t = g.depthColor
      const r1 = Math.round(30 * (1 - t) + 5 * t)
      const g1 = Math.round(144 * (1 - t) + 30 * t)
      const b1 = Math.round(200 * (1 - t) + 80 * t)
      const r2 = Math.round(10 * (1 - t) + 2 * t)
      const g2 = Math.round(60 * (1 - t) + 15 * t)
      const b2 = Math.round(120 * (1 - t) + 50 * t)
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, `rgb(${r1},${g1},${b1})`)
      grad.addColorStop(1, `rgb(${r2},${g2},${b2})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Light rays from top
      ctx.save()
      ctx.globalAlpha = 0.06
      for (let i = 0; i < 5; i++) {
        const rx = (i * 150 + 30) % cw
        ctx.fillStyle = '#87CEEB'
        ctx.beginPath()
        ctx.moveTo(rx - 10, 0)
        ctx.lineTo(rx + 50, CANVAS_H)
        ctx.lineTo(rx + 30, CANVAS_H)
        ctx.lineTo(rx - 30, 0)
        ctx.fill()
      }
      ctx.restore()

      // Seaweed at bottom
      for (const sw of g.seaweed) {
        ctx.fillStyle = '#2D7D2D'
        const sway = Math.sin(g.runTimer * 0.03 + sw.phase) * 8
        ctx.beginPath()
        ctx.moveTo(sw.x - 4, CANVAS_H)
        ctx.quadraticCurveTo(sw.x + sway, CANVAS_H - sw.h * 0.6, sw.x + sway * 0.5, CANVAS_H - sw.h)
        ctx.quadraticCurveTo(sw.x + sway * 0.3, CANVAS_H - sw.h * 0.4, sw.x + 4, CANVAS_H)
        ctx.fill()
      }

      // Fish
      for (const f of g.fish) {
        ctx.fillStyle = f.color
        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.scale(f.dir, 1)
        // Body
        ctx.beginPath()
        ctx.ellipse(0, 0, f.size, f.size * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
        // Tail
        ctx.beginPath()
        ctx.moveTo(-f.size, 0)
        ctx.lineTo(-f.size - 8, -6)
        ctx.lineTo(-f.size - 8, 6)
        ctx.fill()
        // Eye
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(f.size * 0.4, -2, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(f.size * 0.5, -2, 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Decorative coins (pearls)
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sy = dc.y - g.scrollY + CANVAS_H
        if (sy < -20 || sy > CANVAS_H + 20) continue
        ctx.fillStyle = '#F0E6D4'
        ctx.beginPath()
        ctx.arc(dc.x, sy, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#D4C5AA'
        ctx.lineWidth = 1.5
        ctx.stroke()
        // Pearl shine
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.beginPath()
        ctx.arc(dc.x - 2, sy - 2, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Gate marker
      if (!g.paused) {
        const gy = g.nextGateY - g.scrollY + CANVAS_H
        if (gy > -50 && gy < CANVAS_H + 100) {
          ctx.fillStyle = 'rgba(255,217,61,0.3)'
          ctx.fillRect(0, gy - 3, cw, 6)
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(cw / 2 - 18, gy - 32, 36, 28)
          ctx.strokeStyle = '#B8860B'
          ctx.lineWidth = 2
          ctx.strokeRect(cw / 2 - 18, gy - 32, 36, 28)
          ctx.fillStyle = '#B8860B'
          ctx.font = 'bold 18px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', cw / 2, gy - 18)
        }
      }

      // Submarine
      const sx = g.subX
      const sy = CANVAS_H * 0.4 + g.subBob
      const showSub = g.flashTimer <= 0 || Math.floor(g.flashTimer / 4) % 2 === 0
      if (showSub) {
        // Hull
        ctx.fillStyle = '#FFD93D'
        ctx.beginPath()
        ctx.ellipse(sx + SUB_W / 2, sy, SUB_W / 2, SUB_H / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#DAA520'
        ctx.lineWidth = 2
        ctx.stroke()

        // Conning tower
        ctx.fillStyle = '#FFD93D'
        ctx.fillRect(sx + SUB_W / 2 - 8, sy - SUB_H / 2 - 10, 16, 12)
        ctx.strokeStyle = '#DAA520'
        ctx.lineWidth = 1.5
        ctx.strokeRect(sx + SUB_W / 2 - 8, sy - SUB_H / 2 - 10, 16, 12)

        // Periscope
        ctx.fillStyle = '#888'
        ctx.fillRect(sx + SUB_W / 2 - 1.5, sy - SUB_H / 2 - 18, 3, 10)
        ctx.fillRect(sx + SUB_W / 2 - 1.5, sy - SUB_H / 2 - 20, 8, 3)

        // Window
        ctx.fillStyle = '#60A5FA'
        ctx.beginPath()
        ctx.arc(sx + SUB_W / 2, sy, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#93C5FD'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Propeller
        const propAngle = g.runTimer * 0.2
        ctx.save()
        ctx.translate(sx - 2, sy)
        ctx.rotate(propAngle)
        ctx.fillStyle = '#888'
        ctx.fillRect(-2, -8, 4, 16)
        ctx.restore()
      }

      // Bubbles on top
      drawBubbles(ctx, g.bubbles)

      // Feedback
      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      if (g.paused) return
      // Release a burst of bubbles on tap (cosmetic)
      for (let i = 0; i < 3; i++) {
        g.bubbles.push({
          x: g.subX + SUB_W / 2 + (Math.random() - 0.5) * 20,
          y: CANVAS_H * 0.4 + g.subBob - SUB_H / 2,
          r: 2 + Math.random() * 4,
          speed: 0.5 + Math.random() * 1,
        })
      }
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
      <GameHeader title={t('game.subtraction.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={handleReset} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl relative">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          onClick={handleInteract}
          onTouchStart={(e) => { e.preventDefault(); handleInteract() }}
          className="rounded-2xl border-4 border-blue-500 shadow-[0_8px_0_rgba(59,130,246,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {activeProblem && !mario.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
            <div className="mario-question-block border-4 rounded-2xl p-6 sm:p-8 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-lg font-bold text-white/70 mb-2">{t('whatIs')}</p>

              {/* Visual counting icons */}
              <div className="flex flex-wrap justify-center gap-1 mb-2">
                {Array.from({ length: activeProblem.a }).map((_, i) => (
                  <span key={`a-${i}`} className={`text-2xl ${i >= activeProblem.a - activeProblem.b ? 'opacity-30 line-through' : ''}`}>{activeProblem.icon}</span>
                ))}
              </div>

              <p className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>
                {activeProblem.a} - {activeProblem.b} = ?
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

        <p className="text-white/60 text-sm text-center">{t('subtraction.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
