'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMarioGame } from '@/lib/mario'
import { useArcadeCanvas, CANVAS_H } from '@/lib/useArcadeCanvas'
import { drawStars } from '@/lib/canvasHelpers'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'
import { useLanguage } from '@/lib/i18n'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'

const COLORS = [
  { name: 'green', bg: '#22C55E' },
  { name: 'red', bg: '#EF4444' },
  { name: 'blue', bg: '#3B82F6' },
  { name: 'yellow', bg: '#EAB308' },
]

// ---- Canvas state (Disco Floor) ----

interface DiscoState {
  runTimer: number
  discoBallAngle: number
  lightRays: { angle: number; color: string; speed: number }[]
  floorColors: number[] // 4 quadrants
  dancerBob: number
  dancerFrame: number
  stars: { x: number; y: number; r: number; twinkle: number }[]
  activeQuadrant: number // -1 = none
}

const CANVAS_MAX_W = 600

export default function SimonSaysGame() {
  const router = useRouter()
  const mario = useMarioGame()
  const { lang, t } = useLanguage()
  const [sequence, setSequence] = useState<number[]>([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const sequenceRef = useRef(sequence)
  sequenceRef.current = sequence
  const playerIndexRef = useRef(playerIndex)
  playerIndexRef.current = playerIndex

  const clearTimeouts = () => { timeoutRef.current.forEach(t => clearTimeout(t)); timeoutRef.current = [] }

  const { canvasRef, stateRef, canvasWidth } = useArcadeCanvas<DiscoState>({
    init: () => {
      const lightRays: DiscoState['lightRays'] = []
      const rayColors = ['#EF444488', '#3B82F688', '#22C55E88', '#EAB30888', '#EC489988', '#A855F788']
      for (let i = 0; i < 8; i++) lightRays.push({ angle: (i / 8) * Math.PI * 2, color: rayColors[i % rayColors.length], speed: 0.01 + Math.random() * 0.01 })
      const stars: DiscoState['stars'] = []
      for (let i = 0; i < 20; i++) stars.push({ x: Math.random() * CANVAS_MAX_W, y: Math.random() * 60, r: 0.5 + Math.random() * 1, twinkle: Math.random() * Math.PI * 2 })
      return {
        runTimer: 0, discoBallAngle: 0,
        lightRays, floorColors: [0, 0, 0, 0],
        dancerBob: 0, dancerFrame: 0, stars, activeQuadrant: -1,
      }
    },

    update: (g) => {
      g.runTimer++
      g.discoBallAngle += 0.02
      g.dancerBob = Math.sin(g.runTimer * 0.08) * 3
      if (g.runTimer % 15 === 0) g.dancerFrame = (g.dancerFrame + 1) % 2

      for (const ray of g.lightRays) ray.angle += ray.speed
      for (const s of g.stars) s.twinkle += 0.03
    },

    draw: (ctx, g, cw) => {
      // Dark venue background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#0A0A1A')
      grad.addColorStop(1, '#1A0A2E')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cw, CANVAS_H)

      // Sparkly ceiling
      drawStars(ctx, g.stars, cw)

      // Light rays from disco ball
      const ballX = cw / 2
      const ballY = 35
      ctx.save()
      ctx.globalAlpha = 0.12
      for (const ray of g.lightRays) {
        ctx.fillStyle = ray.color
        ctx.beginPath()
        ctx.moveTo(ballX, ballY)
        ctx.lineTo(ballX + Math.cos(ray.angle) * 300, ballY + Math.sin(ray.angle) * 300)
        ctx.lineTo(ballX + Math.cos(ray.angle + 0.08) * 300, ballY + Math.sin(ray.angle + 0.08) * 300)
        ctx.fill()
      }
      ctx.restore()

      // Disco ball
      ctx.fillStyle = '#C0C0C0'
      ctx.beginPath()
      ctx.arc(ballX, ballY, 18, 0, Math.PI * 2)
      ctx.fill()
      // Mirror facets
      ctx.save()
      ctx.translate(ballX, ballY)
      ctx.rotate(g.discoBallAngle)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.fillStyle = i % 2 === 0 ? '#E0E0E0' : '#A0A0A0'
        ctx.fillRect(Math.cos(a) * 8 - 3, Math.sin(a) * 8 - 3, 6, 6)
      }
      ctx.restore()
      // String
      ctx.strokeStyle = '#888'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(ballX, 0)
      ctx.lineTo(ballX, ballY - 18)
      ctx.stroke()

      // Dance floor (4 colored quadrants) — bottom half
      const floorY = 160
      const floorH = CANVAS_H - floorY
      const halfW = cw / 2
      const halfH = floorH / 2
      const quadColors = COLORS.map(c => c.bg)

      for (let q = 0; q < 4; q++) {
        const qx = (q % 2) * halfW
        const qy = floorY + Math.floor(q / 2) * halfH
        const isActive = g.activeQuadrant === q
        ctx.fillStyle = isActive ? quadColors[q] : quadColors[q] + '40'
        ctx.fillRect(qx, qy, halfW, halfH)
        // Grid lines
        ctx.strokeStyle = '#ffffff20'
        ctx.lineWidth = 1
        ctx.strokeRect(qx, qy, halfW, halfH)
        if (isActive) {
          ctx.save()
          ctx.globalAlpha = 0.2
          ctx.fillStyle = '#fff'
          ctx.fillRect(qx, qy, halfW, halfH)
          ctx.restore()
        }
      }

      // Floor grid lines
      ctx.strokeStyle = '#ffffff15'
      ctx.lineWidth = 1
      for (let x = 0; x < cw; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, floorY)
        ctx.lineTo(x, CANVAS_H)
        ctx.stroke()
      }
      for (let y = floorY; y < CANVAS_H; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(cw, y)
        ctx.stroke()
      }

      // Dancer character (center of floor)
      const dx = cw / 2
      const dy = floorY + floorH / 2 - 10 + g.dancerBob
      // Body
      ctx.fillStyle = '#FF6B9D'
      ctx.fillRect(dx - 8, dy + 5, 16, 18)
      // Head
      ctx.fillStyle = '#FFCC80'
      ctx.beginPath()
      ctx.arc(dx, dy - 2, 8, 0, Math.PI * 2)
      ctx.fill()
      // Hair
      ctx.fillStyle = '#4A2C0A'
      ctx.beginPath()
      ctx.arc(dx, dy - 5, 8, Math.PI, 0)
      ctx.fill()
      // Arms (dancing)
      ctx.strokeStyle = '#FFCC80'
      ctx.lineWidth = 3
      const armAngle = g.dancerFrame === 0 ? -0.5 : 0.5
      ctx.beginPath()
      ctx.moveTo(dx - 8, dy + 10)
      ctx.lineTo(dx - 18, dy + armAngle * 15)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(dx + 8, dy + 10)
      ctx.lineTo(dx + 18, dy - armAngle * 15)
      ctx.stroke()
      // Legs
      ctx.fillStyle = '#3B82F6'
      ctx.fillRect(dx - 6, dy + 23, 5, 10)
      ctx.fillRect(dx + 1, dy + 23, 5, 10)
    },
  })

  // Sync activeQuadrant with game state
  const setActiveButton = useCallback((idx: number | null) => {
    const g = stateRef.current
    if (g) g.activeQuadrant = idx ?? -1
  }, [stateRef])

  const playSequence = useCallback((seq: number[]) => {
    setIsShowingSequence(true)
    setIsPlaying(false)
    setPlayerIndex(0)
    clearTimeouts()

    seq.forEach((colorIdx, i) => {
      const t1 = setTimeout(() => setActiveButton(colorIdx), i * 700)
      const t2 = setTimeout(() => setActiveButton(null), i * 700 + 400)
      timeoutRef.current.push(t1, t2)
    })
    const t3 = setTimeout(() => {
      setIsShowingSequence(false)
      setIsPlaying(true)
      setActiveButton(null)
    }, seq.length * 700 + 200)
    timeoutRef.current.push(t3)
  }, [setActiveButton])

  const addRound = useCallback(() => {
    const nextColor = Math.floor(Math.random() * 4)
    const newSeq = [...sequenceRef.current, nextColor]
    setSequence(newSeq)
    setPlayerIndex(0)
    setFeedback(null)
    playSequence(newSeq)
  }, [playSequence])

  const startGame = () => {
    setGameStarted(true)
    mario.resetGame()
    const first = Math.floor(Math.random() * 4)
    const newSeq = [first]
    setSequence(newSeq)
    setPlayerIndex(0)
    setFeedback(null)
    playSequence(newSeq)
  }

  const handlePress = useCallback((colorIdx: number) => {
    if (!isPlaying || isShowingSequence) return
    const seq = sequenceRef.current
    const idx = playerIndexRef.current

    setActiveButton(colorIdx)
    setTimeout(() => setActiveButton(null), 200)

    if (colorIdx === seq[idx]) {
      if (idx === seq.length - 1) {
        setFeedback(mario.onCorrect(lang))
        setIsPlaying(false)
        setTimeout(() => addRound(), 1200)
      } else {
        setPlayerIndex(idx + 1)
      }
    } else {
      mario.onWrong()
      if (mario.lives <= 1) {
        setFeedback(t('simon.gameOverRounds').replace('{rounds}', String(seq.length - 1)))
        setIsPlaying(false)
        setGameStarted(false)
        clearTimeouts()
      } else {
        setFeedback(t('oopsWatch'))
        setIsPlaying(false)
        setTimeout(() => { setFeedback(null); setPlayerIndex(0); playSequence(sequenceRef.current) }, 1200)
      }
    }
  }, [isPlaying, isShowingSequence, addRound, mario, playSequence, setActiveButton, lang, t])

  useEffect(() => { return () => clearTimeouts() }, [])

  return (
    <GameLayout>
      <GameHeader title={t('game.simon.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={() => { mario.resetGame(); setGameStarted(false); setSequence([]); setFeedback(null) }} />}

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <canvas ref={canvasRef} width={canvasWidth} height={CANVAS_H}
          className="rounded-2xl border-4 border-pink-500 shadow-[0_8px_0_rgba(236,72,153,0.4)]"
          style={{ touchAction: 'none', maxWidth: '100%' }} />

        {/* Controls below canvas */}
        {!gameStarted ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/70 text-sm font-bold">{t('simon.watchPattern')}</p>
            {feedback && <p className="text-orange-400 text-sm font-bold">{feedback}</p>}
            <GameButton onClick={startGame} color="green" size="lg">
              {feedback ? t('simon.playAgain') : t('simon.start')}
            </GameButton>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {feedback && !isShowingSequence && (
              <p className="text-center text-green-400 font-bold text-lg mb-2">{feedback}</p>
            )}
            <p className="text-center text-white/60 text-sm mb-2 font-bold">
              {isShowingSequence ? t('simon.watchCarefully') : isPlaying ? t('simon.yourTurn').replace('{current}', String(playerIndex + 1)).replace('{total}', String(sequence.length)) : ''}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((color, i) => (
                <button key={color.name} onClick={() => handlePress(i)} disabled={!isPlaying}
                  className="h-20 sm:h-24 rounded-2xl border-4 border-white/30 transition-all duration-150 disabled:cursor-not-allowed active:scale-95 hover:border-white/60"
                  style={{
                    backgroundColor: color.bg,
                    opacity: isPlaying ? 0.85 : 0.4,
                    transform: stateRef.current?.activeQuadrant === i ? 'scale(1.05)' : undefined,
                    boxShadow: stateRef.current?.activeQuadrant === i ? `0 0 25px ${color.bg}` : `0 4px 0 rgba(0,0,0,0.3)`,
                  }} />
              ))}
            </div>
            <p className="text-center text-white/40 text-sm mt-2 font-bold">{t('simon.round').replace('{round}', String(sequence.length))}</p>
          </div>
        )}

        <p className="text-white/60 text-sm text-center">{t('simon.instruction')}</p>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </GameLayout>
  )
}
