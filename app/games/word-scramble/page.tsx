'use client'

import { useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { speakWord } from '@/lib/games'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawFeedbackText, GATE_SPACING } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

const WORDS = [
  'CAT', 'DOG', 'SUN', 'HAT', 'BIG', 'RUN', 'RED', 'CUP', 'BUS', 'PIG',
  'FISH', 'STAR', 'TREE', 'BOOK', 'CAKE', 'FROG', 'SHIP', 'BIRD', 'MOON', 'BEAR',
]

let wordDeck: string[] = []

function getRandomWord() {
  if (wordDeck.length === 0) {
    wordDeck = [...WORDS].sort(() => Math.random() - 0.5)
  }
  return wordDeck.pop()!
}
function shuffleArray<T>(arr: T[]): T[] {
  const s = [...arr]
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]] }
  return s
}

// ---- Canvas state (Jungle Vine Swing) ----

interface Vine { x: number; len: number; phase: number }
interface Parrot { x: number; y: number; color: string; wingPhase: number }

interface GameState {
  scrollX: number; speed: number; nextGateX: number
  monkeyX: number; monkeyY: number; swingPhase: number; swingVine: number
  vines: Vine[]
  parrots: Parrot[]
  trees: { x: number; h: number }[]
  decCoins: { x: number; y: number; collected: boolean }[]
  runTimer: number; flashTimer: number
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
}

const CANVAS_MAX_W = 600
const CANOPY_Y = 30
const GROUND_Y = CANVAS_H - 30

function generateDecCoins(fromX: number, toX: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cx = fromX + 60; cx < toX - 60; cx += 80) {
    if (Math.random() < 0.5) coins.push({ x: cx, y: 80 + Math.random() * 100, collected: false })
  }
  return coins
}

export default function WordScrambleGame() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const mario = useMarioGame()
  const coinsRef = useRef(0)
  const [activeProblem, setActiveProblem] = useState<string | null>(null)
  const [scrambled, setScrambled] = useState<string[]>([])
  const [placed, setPlaced] = useState<(string | null)[]>([])
  const [available, setAvailable] = useState<boolean[]>([])
  const [cardFeedback, setCardFeedback] = useState<{ text: string; correct: boolean } | null>(null)

  coinsRef.current = mario.coins
  const setActiveProblemRef = useRef(setActiveProblem)
  setActiveProblemRef.current = setActiveProblem

  const { canvasRef, stateRef, canvasWidth, handleInteract, resetState } = useArcadeCanvas<GameState>({
    init: () => {
      const vines: Vine[] = []
      for (let i = 0; i < 10; i++) vines.push({ x: 80 + i * 120, len: 60 + Math.random() * 60, phase: Math.random() * Math.PI * 2 })
      const parrots: Parrot[] = []
      const pColors = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#EC4899']
      for (let i = 0; i < 5; i++) parrots.push({ x: Math.random() * CANVAS_MAX_W * 2, y: 30 + Math.random() * 80, color: pColors[i], wingPhase: Math.random() * Math.PI * 2 })
      const trees: { x: number; h: number }[] = []
      for (let i = 0; i < 6; i++) trees.push({ x: i * 200 + Math.random() * 100, h: 180 + Math.random() * 80 })
      return {
        scrollX: 0, speed: 1.5, nextGateX: GATE_SPACING + 150,
        monkeyX: 80, monkeyY: 120, swingPhase: 0, swingVine: 0,
        vines, parrots, trees,
        decCoins: generateDecCoins(100, GATE_SPACING + 150),
        runTimer: 0, flashTimer: 0,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false,
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--
      g.runTimer++
      g.swingPhase += 0.04

      // Parrots flap
      for (const p of g.parrots) {
        p.wingPhase += 0.1
        p.y += Math.sin(p.wingPhase) * 0.3
      }

      if (g.paused) return

      g.scrollX += g.speed

      // Monkey swings
      const currentVine = g.vines[g.swingVine % g.vines.length]
      const vineScreenX = ((currentVine.x - g.scrollX * 0.8) % (cw + 200))
      g.monkeyX = vineScreenX + Math.sin(g.swingPhase) * 20
      g.monkeyY = CANOPY_Y + currentVine.len + Math.cos(g.swingPhase) * 10

      // Coin collection
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sx = dc.x - g.scrollX
        const dx = g.monkeyX - sx
        const dy = g.monkeyY - dc.y
        if (Math.sqrt(dx * dx + dy * dy) < 25) dc.collected = true
      }

      // Gate check
      const gateScreenX = g.nextGateX - g.scrollX
      if (gateScreenX <= 140) {
        g.paused = true
        const word = getRandomWord()
        setActiveProblemRef.current(word)
        setScrambled(shuffleArray(word.split('')))
        setPlaced(Array(word.length).fill(null))
        setAvailable(Array(word.length).fill(true))
      }

      g.decCoins = g.decCoins.filter(dc => dc.x - g.scrollX > -100)
    },

    draw: (ctx, g, cw) => {
      // Jungle gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#0A3D0A')
      grad.addColorStop(0.3, '#1A5C1A')
      grad.addColorStop(1, '#2D7D2D')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Dappled light
      ctx.save()
      ctx.globalAlpha = 0.05
      for (let i = 0; i < 8; i++) {
        const lx = ((i * 120 + g.scrollX * 0.1) % (cw + 100)) - 50
        ctx.fillStyle = '#FFE066'
        ctx.beginPath()
        ctx.arc(lx, 40 + Math.sin(i + g.runTimer * 0.01) * 20, 30 + Math.sin(i * 2) * 10, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // Tree trunks
      for (const t of g.trees) {
        const tx = ((t.x - g.scrollX * 0.3) % (cw + 200)) - 50
        ctx.fillStyle = '#4A3728'
        ctx.fillRect(tx - 8, GROUND_Y - t.h, 16, t.h)
        // Leaves at top
        ctx.fillStyle = '#1A6B1A'
        ctx.beginPath()
        ctx.ellipse(tx, GROUND_Y - t.h, 35, 20, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Vines
      for (const v of g.vines) {
        const vx = ((v.x - g.scrollX * 0.8) % (cw + 200))
        const sway = Math.sin(g.runTimer * 0.02 + v.phase) * 8
        ctx.strokeStyle = '#228B22'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(vx, 0)
        ctx.quadraticCurveTo(vx + sway, v.len * 0.6, vx + sway * 0.5, v.len + CANOPY_Y)
        ctx.stroke()
        // Vine leaf
        ctx.fillStyle = '#32CD32'
        ctx.beginPath()
        ctx.ellipse(vx + sway * 0.3, v.len * 0.4 + CANOPY_Y, 6, 3, sway * 0.02, 0, Math.PI * 2)
        ctx.fill()
      }

      // Decorative bananas (coins)
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const sx = dc.x - g.scrollX
        if (sx < -20 || sx > cw + 20) continue
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(sx, dc.y, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#DAA520'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Gate marker (big banana bunch)
      if (!g.paused) {
        const gx = g.nextGateX - g.scrollX
        if (gx > 0 && gx < cw + 100) {
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(gx - 18, 60, 36, 30)
          ctx.strokeStyle = '#B8860B'
          ctx.lineWidth = 2
          ctx.strokeRect(gx - 18, 60, 36, 30)
          ctx.fillStyle = '#B8860B'
          ctx.font = 'bold 18px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', gx, 75)
        }
      }

      // Parrots
      for (const p of g.parrots) {
        const px = ((p.x - g.scrollX * 0.5) % (cw + 100)) - 20
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.ellipse(px, p.y, 8, 6, 0, 0, Math.PI * 2)
        ctx.fill()
        // Wing
        const wingUp = Math.sin(p.wingPhase) * 4
        ctx.beginPath()
        ctx.moveTo(px - 5, p.y)
        ctx.lineTo(px - 12, p.y - 4 + wingUp)
        ctx.lineTo(px - 3, p.y + 2)
        ctx.fill()
        // Beak
        ctx.fillStyle = '#FF8C00'
        ctx.beginPath()
        ctx.moveTo(px + 8, p.y)
        ctx.lineTo(px + 13, p.y + 1)
        ctx.lineTo(px + 8, p.y + 3)
        ctx.fill()
        // Eye
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(px + 4, p.y - 1, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Monkey
      const mx = g.monkeyX
      const my = g.monkeyY
      const showMonkey = g.flashTimer <= 0 || Math.floor(g.flashTimer / 4) % 2 === 0
      if (showMonkey) {
        // Body
        ctx.fillStyle = '#8B6914'
        ctx.beginPath()
        ctx.ellipse(mx, my, 10, 13, 0, 0, Math.PI * 2)
        ctx.fill()
        // Head
        ctx.fillStyle = '#A0782C'
        ctx.beginPath()
        ctx.arc(mx, my - 16, 9, 0, Math.PI * 2)
        ctx.fill()
        // Face
        ctx.fillStyle = '#DEBB8C'
        ctx.beginPath()
        ctx.arc(mx, my - 14, 6, 0, Math.PI * 2)
        ctx.fill()
        // Eyes
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(mx - 3, my - 16, 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(mx + 3, my - 16, 1.5, 0, Math.PI * 2)
        ctx.fill()
        // Smile
        ctx.strokeStyle = '#5C3A1E'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(mx, my - 13, 3, 0.2, Math.PI - 0.2)
        ctx.stroke()
        // Tail
        ctx.strokeStyle = '#8B6914'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(mx, my + 10)
        ctx.quadraticCurveTo(mx + 20, my + 20, mx + 15, my + 5)
        ctx.stroke()
        // Arms (reaching up to vine)
        ctx.strokeStyle = '#8B6914'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(mx - 5, my - 8)
        ctx.lineTo(mx - 5, my - 28)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(mx + 5, my - 8)
        ctx.lineTo(mx + 5, my - 28)
        ctx.stroke()
      }

      // Ground (jungle floor)
      ctx.fillStyle = '#1A4A1A'
      ctx.fillRect(0, GROUND_Y, cw, CANVAS_H - GROUND_Y)
      ctx.fillStyle = '#2D5A2D'
      ctx.fillRect(0, GROUND_Y, cw, 4)

      // Feedback
      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      if (!g.paused) {
        g.swingVine++
        g.swingPhase = 0
      }
    },
  })

  const nextSlot = placed.indexOf(null)

  const handleLetterClick = useCallback((index: number) => {
    if (cardFeedback || !available[index] || nextSlot === -1 || !activeProblem) return

    const newPlaced = [...placed]
    newPlaced[nextSlot] = scrambled[index]
    setPlaced(newPlaced)

    const newAvailable = [...available]
    newAvailable[index] = false
    setAvailable(newAvailable)

    if (newPlaced.every(l => l !== null)) {
      const attempt = newPlaced.join('')
      if (attempt === activeProblem) {
        const cheer = mario.onCorrect(lang)
        setCardFeedback({ text: cheer, correct: true })
        speakWord(activeProblem)
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
        }, 1500)
      } else {
        mario.onWrong()
        setCardFeedback({ text: t('notQuite'), correct: false })
        const g = stateRef.current
        if (g) { g.feedbackText = 'Oops!'; g.feedbackColor = '#EF4444'; g.feedbackTimer = 50; g.flashTimer = 60 }
        setTimeout(() => {
          if (activeProblem) {
            setPlaced(Array(activeProblem.length).fill(null))
            setAvailable(Array(activeProblem.length).fill(true))
          }
          setCardFeedback(null)
        }, 1000)
      }
    }
  }, [cardFeedback, available, nextSlot, placed, scrambled, activeProblem, mario, stateRef])

  const handleUndo = () => {
    if (cardFeedback) return
    const lastIdx = placed.reduce((last, val, i) => val !== null ? i : last, -1)
    if (lastIdx === -1) return
    const letter = placed[lastIdx]
    const scrIdx = scrambled.findIndex((s, i) => s === letter && !available[i])
    const newPlaced = [...placed]
    newPlaced[lastIdx] = null
    setPlaced(newPlaced)
    if (scrIdx !== -1) {
      const newAvail = [...available]
      newAvail[scrIdx] = true
      setAvailable(newAvail)
    }
  }

  const handleReset = useCallback(() => {
    mario.resetGame()
    resetState()
    setActiveProblem(null)
    setCardFeedback(null)
    setScrambled([])
    setPlaced([])
    setAvailable([])
  }, [mario, resetState])

  return (
    <GameLayout>
      <GameHeader title={t('game.scramble.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={handleReset} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl relative">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          onClick={handleInteract}
          onTouchStart={(e) => { e.preventDefault(); handleInteract() }}
          className="rounded-2xl border-4 border-green-500 shadow-[0_8px_0_rgba(34,197,94,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {activeProblem && !mario.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
            <div className="mario-question-block border-4 rounded-2xl p-5 sm:p-7 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-lg font-bold text-white/70 mb-3">{t('scramble.prompt')}</p>

              {/* Placed letters */}
              <div className="flex justify-center gap-2 mb-4">
                {placed.map((letter, i) => (
                  <div key={i}
                    className={`w-11 h-13 sm:w-13 sm:h-15 rounded-xl border-3 flex items-center justify-center text-xl sm:text-2xl font-black ${
                      letter ? 'bg-[#FFD93D] border-[#EAB308] text-[#5C3D1E]' : 'bg-white/10 border-white/30 border-dashed'
                    }`}>
                    {letter || ''}
                  </div>
                ))}
              </div>

              {cardFeedback && (
                <p className={`text-xl font-bold mb-3 ${cardFeedback.correct ? 'text-green-600' : 'text-red-500'}`}>{cardFeedback.text}</p>
              )}

              {(!cardFeedback || !cardFeedback.correct) && (
                <>
                  <div className="flex justify-center gap-2 mb-3">
                    {scrambled.map((letter, i) => (
                      <button key={i} onClick={() => handleLetterClick(i)} disabled={!available[i]}
                        className={`w-11 h-13 sm:w-13 sm:h-15 rounded-xl border-3 text-xl sm:text-2xl font-black transition-all ${
                          available[i]
                            ? 'bg-white border-gray-300 text-black shadow-[0_3px_0_#9CA3AF] hover:shadow-[0_1px_0_#9CA3AF] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] cursor-pointer'
                            : 'opacity-20 cursor-not-allowed bg-white/20 border-white/10 text-white/20'
                        }`}>
                        {letter}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleUndo}
                    className="text-sm font-bold text-[#5C3A1E] bg-[#D4A76A] px-4 py-1.5 rounded-full hover:bg-[#C49660] transition-colors">
                    {t('scramble.undo')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('scramble.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
