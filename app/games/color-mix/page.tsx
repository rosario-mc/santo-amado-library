'use client'

import { useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawFeedbackText, drawBubbles, GATE_SPACING } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { useLanguage } from '@/lib/i18n'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'

// ---- Color data (same educational content) ----

const COLOR_COMBOS = [
  { a: 'Red', b: 'Yellow', answer: 'Orange', aColor: '#EF4444', bColor: '#EAB308', answerColor: '#F97316' },
  { a: 'Blue', b: 'Yellow', answer: 'Green', aColor: '#3B82F6', bColor: '#EAB308', answerColor: '#22C55E' },
  { a: 'Red', b: 'Blue', answer: 'Purple', aColor: '#EF4444', bColor: '#3B82F6', answerColor: '#A855F7' },
  { a: 'White', b: 'Red', answer: 'Pink', aColor: '#F5F5F5', bColor: '#EF4444', answerColor: '#EC4899' },
  { a: 'Blue', b: 'White', answer: 'Light Blue', aColor: '#3B82F6', bColor: '#F5F5F5', answerColor: '#38BDF8' },
  { a: 'Red', b: 'Green', answer: 'Brown', aColor: '#EF4444', bColor: '#22C55E', answerColor: '#92400E' },
  { a: 'Yellow', b: 'White', answer: 'Light Yellow', aColor: '#EAB308', bColor: '#F5F5F5', answerColor: '#FDE68A' },
]

const CHOICES = ['Orange', 'Green', 'Purple', 'Pink', 'Light Blue', 'Brown', 'Light Yellow']

interface Problem { combo: typeof COLOR_COMBOS[0]; choices: string[] }

let comboDeck: number[] = []

function generateProblem(): Problem {
  if (comboDeck.length === 0) {
    comboDeck = Array.from({ length: COLOR_COMBOS.length }, (_, i) => i).sort(() => Math.random() - 0.5)
  }
  const combo = COLOR_COMBOS[comboDeck.pop()!]
  const wrong = CHOICES.filter(c => c !== combo.answer).sort(() => Math.random() - 0.5).slice(0, 3)
  const choices = [...wrong, combo.answer].sort(() => Math.random() - 0.5)
  return { combo, choices }
}

// ---- Canvas state (Wizard's Potion Lab) ----

interface Bubble { x: number; y: number; r: number; speed: number }
interface Bottle { x: number; color: string; h: number }

interface GameState {
  scrollX: number; speed: number; nextGateX: number
  cauldronBubbles: Bubble[]
  bottles: Bottle[]
  wizardBob: number; wizardStirAngle: number
  torchFlicker: number
  decCoins: { x: number; y: number; collected: boolean }[]
  runTimer: number; flashTimer: number
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
  pourPhase: number; pourColor: string
}

const CANVAS_MAX_W = 600
const CAULDRON_X = 280
const CAULDRON_Y = 200

function generateDecCoins(fromX: number, toX: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cx = fromX + 60; cx < toX - 60; cx += 80) {
    if (Math.random() < 0.4) coins.push({ x: cx, y: 100 + Math.random() * 60, collected: false })
  }
  return coins
}

export default function ColorMixGame() {
  const router = useRouter()
  const mario = useMarioGame()
  const { lang, t } = useLanguage()
  const coinsRef = useRef(0)
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null)
  const [cardFeedback, setCardFeedback] = useState<{ text: string; correct: boolean } | null>(null)
  const [answered, setAnswered] = useState(false)

  coinsRef.current = mario.coins
  const setActiveProblemRef = useRef(setActiveProblem)
  setActiveProblemRef.current = setActiveProblem

  const { canvasRef, stateRef, canvasWidth, handleInteract, resetState } = useArcadeCanvas<GameState>({
    init: () => {
      const cauldronBubbles: Bubble[] = []
      for (let i = 0; i < 10; i++) {
        cauldronBubbles.push({ x: CAULDRON_X + (Math.random() - 0.5) * 40, y: CAULDRON_Y - 10 - Math.random() * 30, r: 2 + Math.random() * 4, speed: 0.3 + Math.random() * 0.5 })
      }
      const bottles: Bottle[] = []
      const bColors = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#EC4899']
      for (let i = 0; i < 8; i++) {
        bottles.push({ x: 50 + i * 150 + Math.random() * 60, color: bColors[Math.floor(Math.random() * bColors.length)], h: 20 + Math.random() * 15 })
      }
      return {
        scrollX: 0, speed: 1.0, nextGateX: GATE_SPACING + 100,
        cauldronBubbles, bottles,
        wizardBob: 0, wizardStirAngle: 0,
        torchFlicker: 0,
        decCoins: generateDecCoins(100, GATE_SPACING + 100),
        runTimer: 0, flashTimer: 0,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false,
        pourPhase: 0, pourColor: '#A855F7',
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--
      g.runTimer++
      g.wizardBob = Math.sin(g.runTimer * 0.04) * 3
      g.wizardStirAngle += g.paused ? 0.01 : 0.05
      g.torchFlicker = Math.sin(g.runTimer * 0.2) * 3

      // Cauldron bubbles always animate
      for (const b of g.cauldronBubbles) {
        b.y -= b.speed
        b.x += Math.sin(g.runTimer * 0.03 + b.x * 0.1) * 0.4
        if (b.y < CAULDRON_Y - 50) {
          b.y = CAULDRON_Y - 5
          b.x = CAULDRON_X + (Math.random() - 0.5) * 40
        }
      }

      if (g.paused) return

      g.scrollX += g.speed

      // Coin collection near cauldron
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sx = dc.x - g.scrollX
        const dx = CAULDRON_X - sx
        const dy = CAULDRON_Y - dc.y
        if (Math.sqrt(dx * dx + dy * dy) < 30) dc.collected = true
      }

      // Gate check
      const gateScreenX = g.nextGateX - g.scrollX
      if (gateScreenX <= 200) {
        g.paused = true
        const p = generateProblem()
        setActiveProblemRef.current(p)
        g.pourColor = p.combo.aColor
      }

      g.decCoins = g.decCoins.filter(dc => dc.x - g.scrollX > -100)
    },

    draw: (ctx, g, cw) => {
      // Stone lab background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#3A3A4A')
      grad.addColorStop(1, '#2A2A35')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Stone wall texture
      ctx.fillStyle = '#454555'
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
          const ox = j % 2 === 0 ? 0 : 50
          ctx.strokeStyle = '#333345'
          ctx.lineWidth = 1
          ctx.strokeRect(i * 100 + ox, j * 75, 100, 75)
        }
      }

      // Torches on wall
      for (const tx of [80, cw - 80]) {
        // Bracket
        ctx.fillStyle = '#666'
        ctx.fillRect(tx - 3, 50, 6, 25)
        // Flame
        const fl = g.torchFlicker
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        ctx.moveTo(tx - 6, 50)
        ctx.quadraticCurveTo(tx + fl, 25, tx + 6, 50)
        ctx.fill()
        ctx.fillStyle = '#FFD93D'
        ctx.beginPath()
        ctx.moveTo(tx - 3, 50)
        ctx.quadraticCurveTo(tx + fl * 0.5, 32, tx + 3, 50)
        ctx.fill()
        // Glow
        ctx.save()
        ctx.globalAlpha = 0.08
        ctx.fillStyle = '#FF8C42'
        ctx.beginPath()
        ctx.arc(tx, 45, 40, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Shelves with bottles in background
      ctx.fillStyle = '#5A4A3A'
      ctx.fillRect(0, 95, cw, 6)
      for (const b of g.bottles) {
        const bx = ((b.x - g.scrollX * 0.3) % (cw + 100)) - 20
        ctx.fillStyle = b.color
        ctx.fillRect(bx - 5, 95 - b.h, 10, b.h)
        ctx.fillRect(bx - 3, 95 - b.h - 5, 6, 5)
        ctx.fillStyle = `${b.color}44`
        ctx.fillRect(bx - 4, 95 - b.h + 2, 8, b.h - 4)
      }

      // Cauldron
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.ellipse(CAULDRON_X, CAULDRON_Y + 15, 45, 30, 0, 0, Math.PI)
      ctx.fill()
      ctx.fillStyle = '#444'
      ctx.beginPath()
      ctx.ellipse(CAULDRON_X, CAULDRON_Y, 45, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      // Potion liquid
      ctx.fillStyle = g.pourColor + '88'
      ctx.beginPath()
      ctx.ellipse(CAULDRON_X, CAULDRON_Y + 2, 38, 9, 0, 0, Math.PI * 2)
      ctx.fill()
      // Legs
      ctx.fillStyle = '#333'
      ctx.fillRect(CAULDRON_X - 35, CAULDRON_Y + 30, 6, 15)
      ctx.fillRect(CAULDRON_X + 29, CAULDRON_Y + 30, 6, 15)
      // Fire under cauldron
      for (let i = 0; i < 3; i++) {
        const fx = CAULDRON_X - 15 + i * 15
        const fh = 8 + Math.sin(g.runTimer * 0.3 + i) * 3
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        ctx.moveTo(fx - 4, CAULDRON_Y + 40)
        ctx.quadraticCurveTo(fx, CAULDRON_Y + 40 - fh, fx + 4, CAULDRON_Y + 40)
        ctx.fill()
      }

      // Cauldron bubbles
      drawBubbles(ctx, g.cauldronBubbles.map(b => ({ ...b, r: b.r })))

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

      // Gate marker
      if (!g.paused) {
        const gx = g.nextGateX - g.scrollX
        if (gx > 0 && gx < cw + 100) {
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(gx - 18, 130, 36, 28)
          ctx.strokeStyle = '#B8860B'
          ctx.lineWidth = 2
          ctx.strokeRect(gx - 18, 130, 36, 28)
          ctx.fillStyle = '#B8860B'
          ctx.font = 'bold 18px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', gx, 144)
        }
      }

      // Wizard
      const wx = 150
      const wy = 180 + g.wizardBob
      const showWiz = g.flashTimer <= 0 || Math.floor(g.flashTimer / 4) % 2 === 0
      if (showWiz) {
        // Robe
        ctx.fillStyle = '#4A1A8A'
        ctx.beginPath()
        ctx.moveTo(wx - 12, wy + 5)
        ctx.lineTo(wx + 12, wy + 5)
        ctx.lineTo(wx + 16, wy + 45)
        ctx.lineTo(wx - 16, wy + 45)
        ctx.fill()
        // Hat
        ctx.fillStyle = '#4A1A8A'
        ctx.beginPath()
        ctx.moveTo(wx, wy - 35)
        ctx.lineTo(wx + 16, wy - 5)
        ctx.lineTo(wx - 16, wy - 5)
        ctx.fill()
        // Hat brim
        ctx.fillStyle = '#3A0A7A'
        ctx.fillRect(wx - 18, wy - 7, 36, 5)
        // Hat star
        ctx.fillStyle = '#FFD93D'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('★', wx, wy - 15)
        // Face
        ctx.fillStyle = '#FFCC80'
        ctx.beginPath()
        ctx.arc(wx, wy, 8, 0, Math.PI * 2)
        ctx.fill()
        // Eyes
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(wx - 3, wy - 1, 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(wx + 3, wy - 1, 1.5, 0, Math.PI * 2)
        ctx.fill()
        // Beard
        ctx.fillStyle = '#DDD'
        ctx.beginPath()
        ctx.moveTo(wx - 5, wy + 4)
        ctx.quadraticCurveTo(wx, wy + 18, wx + 5, wy + 4)
        ctx.fill()
        // Staff/stir stick reaching to cauldron
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 3
        const stirX = CAULDRON_X + Math.cos(g.wizardStirAngle) * 20
        const stirY = CAULDRON_Y + Math.sin(g.wizardStirAngle) * 5
        ctx.beginPath()
        ctx.moveTo(wx + 12, wy + 10)
        ctx.lineTo(stirX, stirY)
        ctx.stroke()
      }

      // Stone floor
      ctx.fillStyle = '#3A3A45'
      ctx.fillRect(0, CANVAS_H - 30, cw, 30)
      ctx.fillStyle = '#444455'
      ctx.fillRect(0, CANVAS_H - 30, cw, 3)

      // Feedback
      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      // Tap cauldron for extra bubbles
      for (let i = 0; i < 3; i++) {
        g.cauldronBubbles.push({
          x: CAULDRON_X + (Math.random() - 0.5) * 30,
          y: CAULDRON_Y - 5,
          r: 3 + Math.random() * 5,
          speed: 0.5 + Math.random() * 1,
        })
      }
    },
  })

  const handleChoice = useCallback((choice: string) => {
    if (!activeProblem || cardFeedback) return
    const g = stateRef.current
    if (!g) return

    if (choice === activeProblem.combo.answer) {
      const cheer = mario.onCorrect(lang)
      setCardFeedback({ text: cheer, correct: true })
      setAnswered(true)
      g.feedbackText = cheer
      g.feedbackColor = '#22C55E'
      g.feedbackTimer = 70
      g.pourColor = activeProblem.combo.answerColor

      setTimeout(() => {
        setActiveProblem(null)
        setCardFeedback(null)
        setAnswered(false)
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
      setCardFeedback({ text: t('notQuite'), correct: false })
      g.feedbackText = 'Oops!'
      g.feedbackColor = '#EF4444'
      g.feedbackTimer = 50
      g.flashTimer = 60
      setTimeout(() => setCardFeedback(null), 1000)
    }
  }, [activeProblem, cardFeedback, mario, stateRef, lang, t])

  const handleReset = useCallback(() => {
    mario.resetGame()
    resetState()
    setActiveProblem(null)
    setCardFeedback(null)
    setAnswered(false)
  }, [mario, resetState])

  return (
    <GameLayout>
      <GameHeader title={t('game.colorMix.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
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
            <div className="mario-question-block border-4 rounded-2xl p-5 sm:p-7 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-lg font-bold text-white/70 mb-2">{t('colorMix.prompt')}</p>

              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg border-3 border-white/30" style={{ backgroundColor: activeProblem.combo.aColor }} />
                <span className="text-2xl font-black text-white">+</span>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg border-3 border-white/30" style={{ backgroundColor: activeProblem.combo.bColor }} />
                <span className="text-2xl font-black text-white">=</span>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg border-3 border-white/30 flex items-center justify-center"
                  style={{ backgroundColor: answered ? activeProblem.combo.answerColor : '#374151' }}>
                  {!answered && <span className="text-2xl">?</span>}
                </div>
              </div>

              <p className="text-lg font-bold text-white mb-3">{t('color.' + activeProblem.combo.a)} + {t('color.' + activeProblem.combo.b)} = ?</p>

              {cardFeedback && (
                <p className={`text-xl font-bold mb-3 ${cardFeedback.correct ? 'text-green-600' : 'text-red-500'}`}>{cardFeedback.text}</p>
              )}

              {(!cardFeedback || !cardFeedback.correct) && (
                <div className="grid grid-cols-2 gap-2">
                  {activeProblem.choices.map((c) => (
                    <button key={c} onClick={() => handleChoice(c)}
                      className="px-3 py-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#4A7DE0] active:scale-95 border-2 border-white/50 shadow-[0_3px_0_rgba(0,0,0,0.2)] text-white text-sm sm:text-base font-black transition-all"
                      style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>{t('color.' + c)}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('colorMix.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
