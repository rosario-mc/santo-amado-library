'use client'

import { useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import {
  drawCloud, drawSkyGradient, drawGround, drawHills,
  drawFeedbackText, drawSimpleCharacter, drawGateMarker, drawDecorativeCoins,
  CHAR_W, CHAR_H, CHAR_GROUND_Y, GATE_SPACING, GRAVITY, JUMP_FORCE,
} from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

// ---- Math problem generation ----

interface MathProblem {
  question: string
  answer: number
  choices: number[]
}

let lastMathKey = ''

function generateProblem(coins: number): MathProblem {
  let a: number, b: number, answer: number, question: string
  let attempts = 0

  do {
    const useSubtraction = coins >= 16 && Math.random() < 0.4

    if (coins <= 5) {
      a = Math.floor(Math.random() * 5) + 1
      b = Math.floor(Math.random() * 5) + 1
      answer = a + b
      question = `${a} + ${b}`
    } else if (coins <= 15) {
      a = Math.floor(Math.random() * 9) + 1
      b = Math.floor(Math.random() * 9) + 1
      answer = a + b
      question = `${a} + ${b}`
    } else if (useSubtraction) {
      a = Math.floor(Math.random() * 12) + 1
      b = Math.floor(Math.random() * a) + 1
      answer = a - b
      question = `${a} - ${b}`
    } else {
      a = Math.floor(Math.random() * 12) + 1
      b = Math.floor(Math.random() * 12) + 1
      answer = a + b
      question = `${a} + ${b}`
    }
    attempts++
  } while (question === lastMathKey && attempts < 10)
  lastMathKey = question

  const numChoices = coins >= 16 ? 3 : 2
  const choices = [answer]
  while (choices.length < numChoices) {
    const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1)
    const wrong = answer + offset
    if (wrong > 0 && !choices.includes(wrong)) choices.push(wrong)
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { question, answer, choices }
}

// ---- Game state ----

interface GameState {
  charY: number; charVY: number; isJumping: boolean
  runFrame: number; runTimer: number; flashTimer: number
  scrollX: number; speed: number; nextGateX: number
  decCoins: { x: number; y: number; collected: boolean }[]
  clouds: { x: number; y: number; w: number }[]
  feedbackTimer: number; feedbackText: string; feedbackColor: string
  paused: boolean
}

const CANVAS_MAX_W = 600

function generateDecCoins(fromX: number, toX: number) {
  const coins: { x: number; y: number; collected: boolean }[] = []
  for (let cx = fromX + 60; cx < toX - 60; cx += 80) {
    if (Math.random() < 0.5) {
      coins.push({ x: cx, y: CHAR_GROUND_Y - 20 - Math.random() * 40, collected: false })
    }
  }
  return coins
}

export default function MathRunnerGame() {
  const router = useRouter()
  const mario = useMarioGame()
  const { lang, t } = useLanguage()
  const coinsRef = useRef(0)
  const [activeProblem, setActiveProblem] = useState<MathProblem | null>(null)
  const [cardFeedback, setCardFeedback] = useState<{ text: string; correct: boolean } | null>(null)

  coinsRef.current = mario.coins

  const setActiveProblemRef = useRef(setActiveProblem)
  setActiveProblemRef.current = setActiveProblem
  const setCardFeedbackRef = useRef(setCardFeedback)
  setCardFeedbackRef.current = setCardFeedback

  const { canvasRef, stateRef, canvasWidth, handleInteract, resetState } = useArcadeCanvas<GameState>({
    init: () => {
      const clouds: { x: number; y: number; w: number }[] = []
      for (let i = 0; i < 6; i++) {
        clouds.push({ x: Math.random() * CANVAS_MAX_W * 2, y: 20 + Math.random() * 80, w: 40 + Math.random() * 60 })
      }
      return {
        charY: CHAR_GROUND_Y, charVY: 0, isJumping: false,
        runFrame: 0, runTimer: 0, flashTimer: 0,
        scrollX: 0, speed: 1.5, nextGateX: GATE_SPACING + 150,
        decCoins: generateDecCoins(100, GATE_SPACING + 150),
        clouds,
        feedbackTimer: 0, feedbackText: '', feedbackColor: '',
        paused: false,
      }
    },

    update: (g, cw) => {
      if (g.flashTimer > 0) g.flashTimer--
      if (g.feedbackTimer > 0) g.feedbackTimer--

      if (g.paused) {
        g.runTimer++
        if (g.runTimer % 20 === 0) g.runFrame = (g.runFrame + 1) % 2
        for (const cloud of g.clouds) {
          cloud.x -= 0.2
          if (cloud.x + cloud.w < 0) { cloud.x = cw + Math.random() * 200; cloud.y = 20 + Math.random() * 80 }
        }
        return
      }

      g.scrollX += g.speed
      g.charVY += GRAVITY
      g.charY += g.charVY
      if (g.charY >= CHAR_GROUND_Y) { g.charY = CHAR_GROUND_Y; g.charVY = 0; g.isJumping = false }

      g.runTimer++
      if (g.runTimer % 12 === 0) g.runFrame = (g.runFrame + 1) % 2

      for (const cloud of g.clouds) {
        cloud.x -= g.speed * 0.3
        if (cloud.x + cloud.w < 0) { cloud.x = cw + Math.random() * 200; cloud.y = 20 + Math.random() * 80 }
      }

      const charScreenX = 80
      for (const dc of g.decCoins) {
        if (dc.collected) continue
        const dx = charScreenX + CHAR_W / 2 - (dc.x - g.scrollX)
        const dy = g.charY + CHAR_H / 2 - dc.y
        if (Math.sqrt(dx * dx + dy * dy) < 20) dc.collected = true
      }

      const gateScreenX = g.nextGateX - g.scrollX
      if (gateScreenX <= charScreenX + 60) {
        g.paused = true
        const problem = generateProblem(coinsRef.current)
        setActiveProblemRef.current(problem)
        setCardFeedbackRef.current(null)
      }

      g.decCoins = g.decCoins.filter(dc => dc.x - g.scrollX > -100)
    },

    draw: (ctx, g, cw) => {
      drawSkyGradient(ctx, cw, '#87CEEB', '#B8E4F9')
      drawHills(ctx, g.scrollX, cw)

      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      for (const cloud of g.clouds) drawCloud(ctx, cloud.x, cloud.y, cloud.w)

      drawGround(ctx, cw)
      drawDecorativeCoins(ctx, g.decCoins, g.scrollX, cw)

      if (!g.paused) {
        const gx = g.nextGateX - g.scrollX
        if (gx > 0 && gx < cw + 100) drawGateMarker(ctx, gx)
      }

      const showChar = g.flashTimer <= 0 || Math.floor(g.flashTimer / 4) % 2 === 0
      if (showChar) drawSimpleCharacter(ctx, 80, g.charY, CHAR_W, CHAR_H, '#E53935', '#1565C0', g.runFrame, g.isJumping, g.paused)

      drawFeedbackText(ctx, g.feedbackText, g.feedbackColor, g.feedbackTimer, cw)
    },

    onInteract: (g) => {
      if (g.paused || g.isJumping) return
      g.charVY = JUMP_FORCE
      g.isJumping = true
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
        const prevGateX = gs.nextGateX
        gs.nextGateX = prevGateX + GATE_SPACING
        gs.decCoins.push(...generateDecCoins(prevGateX + 60, prevGateX + GATE_SPACING - 60))
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
      <GameHeader title={t('game.mathRun.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={handleReset} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={CANVAS_H}
          onClick={handleInteract}
          onTouchStart={(e) => { e.preventDefault(); handleInteract() }}
          className="rounded-2xl border-4 border-yellow-500 shadow-[0_8px_0_rgba(250,204,21,0.4)] cursor-pointer"
          style={{ touchAction: 'none', maxWidth: '100%' }}
        />

        {activeProblem && !mario.isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
            <div className="mario-question-block border-4 rounded-2xl p-6 sm:p-8 text-center max-w-xs w-full mx-4 animate-bounce-in">
              <p className="text-3xl sm:text-4xl font-black text-white mb-6" style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>
                {activeProblem.question} = ?
              </p>
              {cardFeedback && (
                <p className={`text-xl font-bold mb-4 ${cardFeedback.correct ? 'text-green-600' : 'text-red-500'}`}>
                  {cardFeedback.text}
                </p>
              )}
              {(!cardFeedback || !cardFeedback.correct) && (
                <div className="flex gap-4 justify-center flex-wrap">
                  {activeProblem.choices.map((choice) => (
                    <button key={choice} onClick={() => handleAnswer(choice)}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#5B8DEF] hover:bg-[#4A7DE0] active:scale-95 border-4 border-white/50 shadow-[0_4px_0_rgba(0,0,0,0.2)] text-white text-3xl sm:text-4xl font-black transition-all"
                      style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}>
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('mathRun.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
