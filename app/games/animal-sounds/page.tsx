'use client'

import { useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawSkyGradient, drawGround, drawFeedbackText, drawAcaciaTree, drawCloud, GATE_SPACING } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

// ---- Animal data ----

const ANIMALS = [
  { name: 'Cow', emoji: '🐄', sound: 'Moo!' },
  { name: 'Cat', emoji: '🐱', sound: 'Meow!' },
  { name: 'Dog', emoji: '🐶', sound: 'Woof!' },
  { name: 'Duck', emoji: '🦆', sound: 'Quack!' },
  { name: 'Pig', emoji: '🐷', sound: 'Oink!' },
  { name: 'Rooster', emoji: '🐓', sound: 'Cock-a-doodle-doo!' },
  { name: 'Sheep', emoji: '🐑', sound: 'Baa!' },
  { name: 'Horse', emoji: '🐴', sound: 'Neigh!' },
  { name: 'Lion', emoji: '🦁', sound: 'Roar!' },
  { name: 'Frog', emoji: '🐸', sound: 'Ribbit!' },
  { name: 'Owl', emoji: '🦉', sound: 'Hoot!' },
  { name: 'Snake', emoji: '🐍', sound: 'Hiss!' },
]

interface Problem {
  animal: typeof ANIMALS[0]
  choices: typeof ANIMALS[0][]
}

let animalDeck: number[] = []

function generateProblem(): Problem {
  if (animalDeck.length === 0) {
    animalDeck = Array.from({ length: ANIMALS.length }, (_, i) => i).sort(() => Math.random() - 0.5)
  }
  const animal = ANIMALS[animalDeck.pop()!]
  const others = ANIMALS.filter(a => a.name !== animal.name).sort(() => Math.random() - 0.5).slice(0, 3)
  const choices = [...others, animal].sort(() => Math.random() - 0.5)
  return { animal, choices }
}

function speakSound(text: string, lang: string = 'en') {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.7
  u.pitch = 1.2
  u.lang = lang === 'es' ? 'es-ES' : 'en-US'
  window.speechSynthesis.speak(u)
}

// ---- Canvas state ----

interface Tree { x: number; scale: number }
interface Bush { x: number; animalIdx: number }

interface GameState {
  scrollX: number; speed: number; nextGateX: number
  jeepBob: number
  trees: Tree[]
  bushes: Bush[]
  clouds: { x: number; y: number; w: number }[]
  decCoins: { x: number; y: number; collected: boolean }[]
  runFrame: number; runTimer: number; flashTimer: number
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
  wheelAngle: number
}

const CANVAS_MAX_W = 600
const GROUND_H = 40
const GROUND_TOP = CANVAS_H - GROUND_H

function generateDecCoins(fromX: number, toX: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cx = fromX + 60; cx < toX - 60; cx += 80) {
    if (Math.random() < 0.4) {
      coins.push({ x: cx, y: GROUND_TOP - 30 - Math.random() * 30, collected: false })
    }
  }
  return coins
}

export default function AnimalSoundsGame() {
  const router = useRouter()
  const mario = useMarioGame()
  const { lang, t } = useLanguage()
  const coinsRef = useRef(0)
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null)
  const [cardFeedback, setCardFeedback] = useState<{ text: string; correct: boolean } | null>(null)
  const [revealed, setRevealed] = useState(false)

  coinsRef.current = mario.coins
  const langRef = useRef(lang)
  langRef.current = lang
  const tRef = useRef(t)
  tRef.current = t
  const setActiveProblemRef = useRef(setActiveProblem)
  setActiveProblemRef.current = setActiveProblem
  const setCardFeedbackRef = useRef(setCardFeedback)
  setCardFeedbackRef.current = setCardFeedback

  const { canvasRef, stateRef, canvasWidth, handleInteract, resetState } = useArcadeCanvas<GameState>({
    init: () => {
      const trees: Tree[] = []
      for (let i = 0; i < 8; i++) trees.push({ x: 100 + i * 200 + Math.random() * 80, scale: 0.8 + Math.random() * 0.4 })
      const bushes: Bush[] = []
      for (let i = 0; i < 6; i++) bushes.push({ x: 150 + i * 250 + Math.random() * 100, animalIdx: Math.floor(Math.random() * ANIMALS.length) })
      const clouds: { x: number; y: number; w: number }[] = []
      for (let i = 0; i < 5; i++) clouds.push({ x: Math.random() * CANVAS_MAX_W * 2, y: 15 + Math.random() * 60, w: 40 + Math.random() * 50 })
      return {
        scrollX: 0, speed: 1.5, nextGateX: GATE_SPACING + 150,
        jeepBob: 0,
        trees, bushes, clouds,
        decCoins: generateDecCoins(100, GATE_SPACING + 150),
        runFrame: 0, runTimer: 0, flashTimer: 0,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false, wheelAngle: 0,
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--
      g.runTimer++
      g.jeepBob = Math.sin(g.runTimer * 0.15) * 2

      for (const c of g.clouds) {
        c.x -= g.paused ? 0.2 : g.speed * 0.3
        if (c.x + c.w < 0) { c.x = cw + Math.random() * 200; c.y = 15 + Math.random() * 60 }
      }

      if (g.paused) return

      g.scrollX += g.speed
      g.wheelAngle += g.speed * 0.1

      // Coin collection
      const jeepX = 80
      const jeepY = GROUND_TOP - 32 + g.jeepBob
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const dx = jeepX + 30 - (dc.x - g.scrollX)
        const dy = jeepY + 15 - dc.y
        if (Math.sqrt(dx * dx + dy * dy) < 25) dc.collected = true
      }

      // Gate check
      const gateScreenX = g.nextGateX - g.scrollX
      if (gateScreenX <= jeepX + 60) {
        g.paused = true
        const p = generateProblem()
        setActiveProblemRef.current(p)
        setCardFeedbackRef.current(null)
        speakSound(tRef.current('sound.' + p.animal.sound), langRef.current)
      }

      g.decCoins = g.decCoins.filter(dc => dc.x - g.scrollX > -100)
    },

    draw: (ctx, g, cw) => {
      // Savanna sky
      drawSkyGradient(ctx, cw, '#FDB813', '#87CEEB', CANVAS_H - GROUND_H)

      // Sun
      ctx.fillStyle = '#FFE066'
      ctx.beginPath()
      ctx.arc(cw - 60, 50, 30, 0, Math.PI * 2)
      ctx.fill()

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      for (const c of g.clouds) drawCloud(ctx, c.x, c.y, c.w)

      // Background trees
      for (const t of g.trees) {
        const tx = ((t.x - g.scrollX * 0.3) % (cw + 200)) - 50
        ctx.save()
        ctx.scale(t.scale, t.scale)
        drawAcaciaTree(ctx, tx / t.scale, GROUND_TOP / t.scale)
        ctx.restore()
      }

      // Bushes with hidden animals
      for (const b of g.bushes) {
        const bx = ((b.x - g.scrollX * 0.6) % (cw + 200)) - 50
        ctx.fillStyle = '#3D8B3D'
        ctx.beginPath()
        ctx.ellipse(bx, GROUND_TOP - 5, 24, 16, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#2D7D2D'
        ctx.beginPath()
        ctx.ellipse(bx - 8, GROUND_TOP - 2, 18, 12, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Ground (sandy savanna)
      drawGround(ctx, cw, '#D4A76A', '#C4975A')

      // Decorative binoculars (coins)
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
          // Sign post
          ctx.fillStyle = '#8B5E3C'
          ctx.fillRect(gx - 3, GROUND_TOP - 100, 6, 100)
          ctx.fillStyle = '#FFD93D'
          ctx.fillRect(gx - 20, GROUND_TOP - 100, 40, 30)
          ctx.strokeStyle = '#B8860B'
          ctx.lineWidth = 2
          ctx.strokeRect(gx - 20, GROUND_TOP - 100, 40, 30)
          ctx.fillStyle = '#B8860B'
          ctx.font = 'bold 18px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', gx, GROUND_TOP - 85)
        }
      }

      // Jeep
      const jx = 60
      const jy = GROUND_TOP - 32 + g.jeepBob
      const showJeep = g.flashTimer <= 0 || Math.floor(g.flashTimer / 4) % 2 === 0
      if (showJeep) {
        // Body
        ctx.fillStyle = '#4A7D4A'
        ctx.fillRect(jx, jy, 60, 22)
        // Cabin
        ctx.fillStyle = '#3D6B3D'
        ctx.fillRect(jx + 10, jy - 16, 35, 18)
        // Windshield
        ctx.fillStyle = '#87CEEB'
        ctx.fillRect(jx + 38, jy - 14, 6, 12)
        // Wheels
        ctx.fillStyle = '#333'
        ctx.beginPath()
        ctx.arc(jx + 12, jy + 22, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(jx + 48, jy + 22, 8, 0, Math.PI * 2)
        ctx.fill()
        // Wheel spokes
        ctx.strokeStyle = '#666'
        ctx.lineWidth = 1.5
        for (const wx of [jx + 12, jx + 48]) {
          ctx.beginPath()
          ctx.moveTo(wx + Math.cos(g.wheelAngle) * 5, jy + 22 + Math.sin(g.wheelAngle) * 5)
          ctx.lineTo(wx - Math.cos(g.wheelAngle) * 5, jy + 22 - Math.sin(g.wheelAngle) * 5)
          ctx.stroke()
        }
        // Headlight
        ctx.fillStyle = '#FFE066'
        ctx.beginPath()
        ctx.arc(jx + 60, jy + 10, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Feedback
      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      // Honk! (cosmetic visual)
      if (!g.paused) {
        g.feedbackText = 'HONK! 📯'
        g.feedbackColor = '#FFD93D'
        g.feedbackTimer = 30
      }
    },
  })

  const handleChoice = useCallback((chosenName: string) => {
    if (!activeProblem) return
    const g = stateRef.current
    if (!g) return

    if (chosenName === activeProblem.animal.name) {
      const cheer = mario.onCorrect(lang)
      setCardFeedback({ text: cheer, correct: true })
      setRevealed(true)
      g.feedbackText = cheer
      g.feedbackColor = '#22C55E'
      g.feedbackTimer = 70

      setTimeout(() => {
        setActiveProblem(null)
        setCardFeedback(null)
        setRevealed(false)
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
      setCardFeedback({ text: t('listenAgain'), correct: false })
      g.feedbackText = 'Oops!'
      g.feedbackColor = '#EF4444'
      g.feedbackTimer = 50
      g.flashTimer = 60
      setTimeout(() => setCardFeedback(null), 1000)
    }
  }, [activeProblem, mario, stateRef])

  const handleReset = useCallback(() => {
    mario.resetGame()
    resetState()
    setActiveProblem(null)
    setCardFeedback(null)
    setRevealed(false)
  }, [mario, resetState])

  return (
    <GameLayout>
      <GameHeader title={t('game.animals.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={handleReset} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl relative">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          onClick={handleInteract}
          onTouchStart={(e) => { e.preventDefault(); handleInteract() }}
          className="rounded-2xl border-4 border-orange-500 shadow-[0_8px_0_rgba(251,146,60,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {activeProblem && !mario.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
            <div className="mario-question-block border-4 rounded-2xl p-5 sm:p-7 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-lg font-bold text-white/70 mb-1">{t('animals.prompt')}</p>
              <p className="text-2xl sm:text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>
                &quot;{t('sound.' + activeProblem.animal.sound)}&quot;
              </p>

              {revealed && (
                <p className="text-6xl mb-2">{activeProblem.animal.emoji}</p>
              )}

              <button onClick={() => speakSound(t('sound.' + activeProblem.animal.sound), lang)}
                className="text-sm font-bold text-[#5C3A1E] bg-[#FFD93D] px-4 py-1.5 rounded-full mb-4 hover:bg-[#FFCD00] transition-colors">
                {t('animals.hearIt')}
              </button>

              {cardFeedback && (
                <p className={`text-xl font-bold mb-3 ${cardFeedback.correct ? 'text-green-600' : 'text-red-500'}`}>{cardFeedback.text}</p>
              )}

              {(!cardFeedback || !cardFeedback.correct) && (
                <div className="grid grid-cols-2 gap-2">
                  {activeProblem.choices.map((c) => (
                    <button key={c.name} onClick={() => handleChoice(c.name)}
                      className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#4A7DE0] active:scale-95 border-2 border-white/50 shadow-[0_3px_0_rgba(0,0,0,0.2)] transition-all">
                      <span className="text-3xl">{c.emoji}</span>
                      <span className="text-xs font-bold text-white">{t('animal.' + c.name)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('animals.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
