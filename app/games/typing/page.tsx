'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { speakWord as speakWordUtil } from '@/lib/games'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawWaves, drawCloud, drawFeedbackText, GATE_SPACING } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

const WORDS = [
  'cat', 'dog', 'sun', 'hat', 'run', 'big', 'red', 'cup', 'mom', 'dad',
  'bat', 'pig', 'hop', 'bed', 'bus', 'map', 'pen', 'leg', 'sit', 'top',
  'fox', 'box', 'bug', 'hug', 'mug', 'rug', 'tub', 'fan', 'van', 'jam',
]

let wordDeck: string[] = []

function pickWord() {
  if (wordDeck.length === 0) {
    wordDeck = [...WORDS].sort(() => Math.random() - 0.5)
  }
  return wordDeck.pop()!
}

// ---- Canvas state ----

interface Island { x: number; palmPhase: number }

interface GameState {
  scrollX: number; speed: number; nextGateX: number
  shipBob: number
  clouds: { x: number; y: number; w: number }[]
  islands: Island[]
  wavePhase: number
  decCoins: { x: number; y: number; collected: boolean }[]
  runTimer: number; flashTimer: number
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
  flagWave: number
}

const CANVAS_MAX_W = 600
const WATER_Y = 190

function generateDecCoins(fromX: number, toX: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cx = fromX + 60; cx < toX - 60; cx += 80) {
    if (Math.random() < 0.4) coins.push({ x: cx, y: WATER_Y - 20 - Math.random() * 40, collected: false })
  }
  return coins
}

export default function TypingGame() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const mario = useMarioGame()
  const coinsRef = useRef(0)
  const [activeProblem, setActiveProblem] = useState<string | null>(null)
  const [userInput, setUserInput] = useState('')
  const [cardFeedback, setCardFeedback] = useState<{ text: string; correct: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  coinsRef.current = mario.coins
  const setActiveProblemRef = useRef(setActiveProblem)
  setActiveProblemRef.current = setActiveProblem

  const { canvasRef, stateRef, canvasWidth, handleInteract, resetState } = useArcadeCanvas<GameState>({
    init: () => {
      const clouds: { x: number; y: number; w: number }[] = []
      for (let i = 0; i < 5; i++) clouds.push({ x: Math.random() * CANVAS_MAX_W * 2, y: 15 + Math.random() * 60, w: 40 + Math.random() * 50 })
      const islands: Island[] = []
      for (let i = 0; i < 3; i++) islands.push({ x: 300 + i * 500 + Math.random() * 200, palmPhase: Math.random() * Math.PI * 2 })
      return {
        scrollX: 0, speed: 1.5, nextGateX: GATE_SPACING + 150,
        shipBob: 0, clouds, islands, wavePhase: 0,
        decCoins: generateDecCoins(100, GATE_SPACING + 150),
        runTimer: 0, flashTimer: 0,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false, flagWave: 0,
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--
      g.runTimer++
      g.wavePhase += 0.05
      g.shipBob = Math.sin(g.runTimer * 0.06) * 4
      g.flagWave += 0.1

      for (const c of g.clouds) {
        c.x -= g.paused ? 0.2 : g.speed * 0.3
        if (c.x + c.w < 0) { c.x = cw + Math.random() * 200; c.y = 15 + Math.random() * 60 }
      }

      if (g.paused) return

      g.scrollX += g.speed

      // Coin collection
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const dx = 90 - (dc.x - g.scrollX)
        const dy = (WATER_Y - 10 + g.shipBob) - dc.y
        if (Math.sqrt(dx * dx + dy * dy) < 25) dc.collected = true
      }

      // Gate check
      const gateScreenX = g.nextGateX - g.scrollX
      if (gateScreenX <= 140) {
        g.paused = true
        const word = pickWord()
        setActiveProblemRef.current(word)
        speakWordUtil(word)
      }

      g.decCoins = g.decCoins.filter(dc => dc.x - g.scrollX > -100)
    },

    draw: (ctx, g, cw) => {
      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, WATER_Y)
      grad.addColorStop(0, '#87CEEB')
      grad.addColorStop(1, '#E0F2FE')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, WATER_Y)

      // Sun
      ctx.fillStyle = '#FFE066'
      ctx.beginPath()
      ctx.arc(cw - 60, 45, 25, 0, Math.PI * 2)
      ctx.fill()

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      for (const c of g.clouds) drawCloud(ctx, c.x, c.y, c.w)

      // Islands in background
      for (const isl of g.islands) {
        const ix = ((isl.x - g.scrollX * 0.4) % (cw + 400)) - 100
        // Sand
        ctx.fillStyle = '#F5DEB3'
        ctx.beginPath()
        ctx.ellipse(ix, WATER_Y + 5, 40, 12, 0, 0, Math.PI * 2)
        ctx.fill()
        // Palm trunk
        ctx.strokeStyle = '#8B6914'
        ctx.lineWidth = 4
        const sway = Math.sin(g.runTimer * 0.02 + isl.palmPhase) * 3
        ctx.beginPath()
        ctx.moveTo(ix, WATER_Y - 5)
        ctx.quadraticCurveTo(ix + sway, WATER_Y - 35, ix + sway * 2, WATER_Y - 55)
        ctx.stroke()
        // Palm leaves
        ctx.fillStyle = '#228B22'
        const leafX = ix + sway * 2
        const leafY = WATER_Y - 55
        for (let a = 0; a < 5; a++) {
          const angle = (a / 5) * Math.PI * 2 + g.runTimer * 0.01
          ctx.beginPath()
          ctx.ellipse(leafX + Math.cos(angle) * 15, leafY + Math.sin(angle) * 8, 14, 4, angle, 0, Math.PI * 2)
          ctx.fill()
        }
        // Treasure chest
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(ix + 15, WATER_Y - 2, 16, 10)
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(ix + 21, WATER_Y, 4, 4)
      }

      // Gate marker (treasure island sign)
      if (!g.paused) {
        const gx = g.nextGateX - g.scrollX
        if (gx > 0 && gx < cw + 100) {
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(gx - 2, WATER_Y - 60, 4, 60)
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(gx - 18, WATER_Y - 60, 36, 26)
          ctx.strokeStyle = '#B8860B'
          ctx.lineWidth = 2
          ctx.strokeRect(gx - 18, WATER_Y - 60, 36, 26)
          ctx.fillStyle = '#B8860B'
          ctx.font = 'bold 16px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', gx, WATER_Y - 47)
        }
      }

      // Ocean
      drawWaves(ctx, cw, WATER_Y, g.scrollX, '#1E88E5')
      // Deeper water
      ctx.fillStyle = '#1565C0'
      ctx.fillRect(0, WATER_Y + 15, cw, CANVAS_H - WATER_Y - 15)

      // Decorative coins (treasure floating)
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

      // Pirate ship
      const sx = 60
      const sy = WATER_Y - 10 + g.shipBob
      const showShip = g.flashTimer <= 0 || Math.floor(g.flashTimer / 4) % 2 === 0
      if (showShip) {
        // Hull
        ctx.fillStyle = '#8B4513'
        ctx.beginPath()
        ctx.moveTo(sx - 20, sy)
        ctx.lineTo(sx + 60, sy)
        ctx.lineTo(sx + 50, sy + 18)
        ctx.lineTo(sx - 10, sy + 18)
        ctx.closePath()
        ctx.fill()
        // Deck line
        ctx.fillStyle = '#A0522D'
        ctx.fillRect(sx - 18, sy, 76, 4)
        // Mast
        ctx.fillStyle = '#5C3A1E'
        ctx.fillRect(sx + 18, sy - 55, 4, 55)
        // Sail
        ctx.fillStyle = '#FFF8E7'
        ctx.beginPath()
        ctx.moveTo(sx + 22, sy - 50)
        ctx.lineTo(sx + 50, sy - 35)
        ctx.lineTo(sx + 22, sy - 15)
        ctx.closePath()
        ctx.fill()
        // Skull on sail
        ctx.fillStyle = '#333'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('☠', sx + 32, sy - 30)
        // Flag
        const flagSway = Math.sin(g.flagWave) * 4
        ctx.fillStyle = '#1a1a1a'
        ctx.beginPath()
        ctx.moveTo(sx + 22, sy - 55)
        ctx.lineTo(sx + 35 + flagSway, sy - 60)
        ctx.lineTo(sx + 35 + flagSway, sy - 50)
        ctx.closePath()
        ctx.fill()
      }

      // Feedback
      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      if (g.paused) return
      // Wave splash effect
      g.feedbackText = 'SPLASH! 🌊'
      g.feedbackColor = '#38BDF8'
      g.feedbackTimer = 25
    },
  })

  // Focus input when problem appears
  useEffect(() => {
    if (activeProblem) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [activeProblem])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    if (!activeProblem) return

    if (value.trimEnd() === activeProblem) {
      const cheer = mario.onCorrect(lang)
      setCardFeedback({ text: cheer, correct: true })
      setUserInput('')
      const g = stateRef.current
      if (g) { g.feedbackText = cheer; g.feedbackColor = '#22C55E'; g.feedbackTimer = 70 }

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
      setUserInput(value)
    }
  }

  const handleReset = () => {
    mario.resetGame()
    resetState()
    setActiveProblem(null)
    setCardFeedback(null)
    setUserInput('')
  }

  const renderLetterHint = () => {
    if (!activeProblem) return null
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {activeProblem.split('').map((char, i) => (
          <div key={i}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold border-2 transition-colors ${
              i < userInput.length
                ? userInput[i] === char
                  ? 'border-green-400 bg-green-100 text-green-600'
                  : 'border-red-300 bg-red-100 text-red-500'
                : 'border-zinc-200 bg-white text-zinc-300'
            }`}>
            {i < userInput.length ? char : '?'}
          </div>
        ))}
      </div>
    )
  }

  return (
    <GameLayout>
      <GameHeader title={t('game.typing.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
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
            <div className="mario-question-block border-4 rounded-2xl p-5 sm:p-7 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-lg font-bold text-white/70 mb-2">{t('typing.prompt')}</p>

              {/* Word display */}
              <div className="mb-3">
                {activeProblem.split('').map((char, i) => {
                  let color = 'text-zinc-400'
                  if (i < userInput.length) color = userInput[i] === char ? 'text-green-600' : 'text-red-500'
                  return <span key={i} className={`text-4xl sm:text-5xl font-bold font-mono tracking-[0.15em] ${color} transition-colors`}>{char}</span>
                })}
              </div>

              <button onClick={() => speakWordUtil(activeProblem)}
                className="text-sm font-bold text-[#5C3A1E] bg-[#FFD93D] px-4 py-1.5 rounded-full mb-3 hover:bg-[#FFCD00] transition-colors">
                {t('typing.hearAgain')}
              </button>

              {renderLetterHint()}

              {cardFeedback && (
                <p className={`text-xl font-bold mt-3 ${cardFeedback.correct ? 'text-green-600' : 'text-red-500'}`}>{cardFeedback.text}</p>
              )}

              {(!cardFeedback || !cardFeedback.correct) && (
                <div className="mt-3">
                  <input ref={inputRef} type="text" value={userInput} onChange={handleInputChange}
                    className="w-full max-w-[200px] text-center text-2xl sm:text-3xl font-bold font-mono border-4 border-blue-300 rounded-2xl px-4 py-2 focus:outline-none focus:border-blue-500 text-black tracking-widest"
                    placeholder="type..." autoComplete="off" autoCapitalize="off" spellCheck={false} />
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('typing.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
