'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { speakWord } from '@/lib/games'
import { useMarioGame } from '@/lib/mario'
import { GameHeader, GameButton } from '@/components/ui'
import { PowerUpOverlay, GameOverOverlay } from '@/components/MarioOverlays'
import { useLanguage } from '@/lib/i18n'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MATCH_THRESHOLD = 15

export default function WritingGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const guideCanvasRef = useRef<HTMLCanvasElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const mario = useMarioGame()
  const { lang, t } = useLanguage()
  const [mode, setMode] = useState<'trace' | 'free'>('trace')
  const [canvasSize, setCanvasSize] = useState(300)
  const [hasDrawn, setHasDrawn] = useState(false)
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bgAnimRef = useRef<number>(0)
  const bgStateRef = useRef({ timer: 0, clouds: [] as { x: number; y: number; w: number }[], plane: { x: 0, y: 0 } })

  const currentLetter = LETTERS[currentLetterIndex]

  useEffect(() => {
    const updateSize = () => setCanvasSize(Math.min(window.innerWidth - 64, 350))
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Sky background animation
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current
    if (!bgCanvas) return
    const ctx = bgCanvas.getContext('2d')
    if (!ctx) return

    const state = bgStateRef.current
    if (state.clouds.length === 0) {
      for (let i = 0; i < 6; i++) state.clouds.push({ x: Math.random() * canvasSize * 2, y: 10 + Math.random() * 40, w: 30 + Math.random() * 40 })
    }
    state.plane = { x: 30, y: canvasSize * 0.3 }

    const draw = () => {
      state.timer++
      bgCanvas.width = canvasSize
      bgCanvas.height = canvasSize

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvasSize)
      grad.addColorStop(0, '#87CEEB')
      grad.addColorStop(1, '#E0F7FA')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvasSize, canvasSize)

      // Sun
      ctx.fillStyle = '#FFE066'
      ctx.beginPath()
      ctx.arc(canvasSize - 40, 35, 20, 0, Math.PI * 2)
      ctx.fill()

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      for (const c of state.clouds) {
        c.x -= 0.2
        if (c.x + c.w < 0) { c.x = canvasSize + Math.random() * 100; c.y = 10 + Math.random() * 40 }
        ctx.beginPath()
        ctx.ellipse(c.x, c.y, c.w / 2, c.w * 0.25, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      bgAnimRef.current = requestAnimationFrame(draw)
    }

    bgAnimRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(bgAnimRef.current)
  }, [canvasSize])

  const renderGuideCanvas = useCallback(() => {
    const guide = guideCanvasRef.current
    if (!guide) return
    guide.width = canvasSize; guide.height = canvasSize
    const ctx = guide.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, guide.width, guide.height)
    ctx.fillStyle = '#000'
    ctx.font = `bold ${guide.width * 0.7}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(currentLetter, guide.width / 2, guide.height / 2)
  }, [currentLetter, canvasSize])

  const drawGuideLetter = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Transparent background (sky shows through)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Ruled lines
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.3); ctx.lineTo(canvas.width, canvas.height * 0.3); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.7); ctx.lineTo(canvas.width, canvas.height * 0.7); ctx.stroke()
    ctx.setLineDash([])

    if (mode === 'trace') {
      // Cloud formation guide
      ctx.font = `bold ${canvas.width * 0.7}px sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.fillText(currentLetter, canvas.width / 2, canvas.height / 2)
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 3
      ctx.strokeText(currentLetter, canvas.width / 2, canvas.height / 2)
      ctx.setLineDash([])
    }
  }, [currentLetter, mode, canvasSize])

  useEffect(() => {
    drawGuideLetter()
    renderGuideCanvas()
    speakWord(currentLetter)
    setHasDrawn(false)
  }, [currentLetter, drawGuideLetter, renderGuideCanvas])

  const checkDrawing = useCallback(() => {
    const canvas = canvasRef.current
    const guide = guideCanvasRef.current
    if (!canvas || !guide) return
    const ctx = canvas.getContext('2d')
    const guideCtx = guide.getContext('2d')
    if (!ctx || !guideCtx) return

    const drawnData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const guideData = guideCtx.getImageData(0, 0, guide.width, guide.height).data
    let guidePixels = 0, coveredPixels = 0
    for (let i = 0; i < guideData.length; i += 4) {
      if (guideData[i + 3] > 128) {
        guidePixels++
        const r = drawnData[i], g = drawnData[i + 1], b = drawnData[i + 2]
        // Smoke trail color is white/light gray
        if (r > 180 && g > 180 && b > 180 && drawnData[i + 3] > 100) coveredPixels++
      }
    }
    if (guidePixels === 0) return
    const coverage = (coveredPixels / guidePixels) * 100
    if (coverage >= MATCH_THRESHOLD) {
      setFeedback(mario.onCorrect(lang))
      setTimeout(() => { setFeedback(null); setCurrentLetterIndex(i => (i + 1) % LETTERS.length) }, 1200)
    }
  }, [canvasSize, mario])

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setIsDrawing(true); setHasDrawn(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    // Smoke trail style: white with some transparency
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([])
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([])
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
  }

  const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    setIsDrawing(false)
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
    checkTimeoutRef.current = setTimeout(() => checkDrawing(), 800)
  }

  const clearCanvas = () => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
    setHasDrawn(false); drawGuideLetter()
  }

  const nextLetter = () => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
    setFeedback(mario.onCorrect())
    setTimeout(() => { setFeedback(null); setCurrentLetterIndex(i => (i + 1) % LETTERS.length) }, 1000)
  }

  const prevLetter = () => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
    setCurrentLetterIndex(i => (i - 1 + LETTERS.length) % LETTERS.length)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 py-6 relative overflow-hidden">
      {/* Floating ? blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <span className="absolute text-[12rem] font-black text-white/[0.03] question-drift-1" style={{ top: '10%', left: '5%' }}>?</span>
        <span className="absolute text-[8rem] font-black text-white/[0.03] question-drift-2" style={{ top: '60%', right: '8%' }}>?</span>
      </div>

      <GameHeader title={t('game.writing.title')} score={mario.coins} lives={mario.lives} world={mario.world} powerUp={mario.powerUp} onDismissPowerUp={mario.dismissPowerUp} />
      <PowerUpOverlay powerUp={mario.powerUp} onDismiss={mario.dismissPowerUp} />
      {mario.isGameOver && <GameOverOverlay onRetry={() => { mario.resetGame(); setCurrentLetterIndex(0); setFeedback(null); clearCanvas() }} />}

      <div className="flex gap-2">
        <GameButton onClick={() => setMode('trace')} color={mode === 'trace' ? 'blue' : 'black'} size="sm" className="rounded-full">{t('writing.traceMode')}</GameButton>
        <GameButton onClick={() => setMode('free')} color={mode === 'free' ? 'blue' : 'black'} size="sm" className="rounded-full">{t('writing.freeWrite')}</GameButton>
      </div>

      <div className="flex items-center gap-4">
        <GameButton onClick={prevLetter} color="orange" size="sm" className="w-10 h-10 rounded-full !p-0 flex items-center justify-center">&#8249;</GameButton>
        <div className="text-center">
          <p className="text-6xl sm:text-8xl font-bold text-[#FFD93D]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{currentLetter}</p>
          <p className="text-lg text-white/50 font-mono">{currentLetter.toLowerCase()}</p>
        </div>
        <GameButton onClick={() => speakWord(currentLetter)} color="blue" size="sm" className="w-10 h-10 rounded-full !p-0 flex items-center justify-center">🔊</GameButton>
      </div>

      {feedback && <p className="text-2xl font-bold text-green-400 animate-bounce">{feedback}</p>}

      <div className="rounded-2xl border-4 border-sky-400 overflow-hidden shadow-lg relative" style={{ width: canvasSize, height: canvasSize }}>
        {/* Sky background canvas */}
        <canvas ref={bgCanvasRef} width={canvasSize} height={canvasSize}
          className="absolute inset-0" style={{ pointerEvents: 'none' }} />
        {/* Drawing canvas (transparent, layered on top) */}
        <canvas ref={canvasRef} width={canvasSize} height={canvasSize}
          className="absolute inset-0 touch-none cursor-crosshair"
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
        {/* Hidden guide canvas */}
        <canvas ref={guideCanvasRef} width={canvasSize} height={canvasSize} className="hidden" />
      </div>

      {!hasDrawn && !feedback && (
        <p className="text-sm text-white/50">{mode === 'trace' ? t('writing.traceGuide') : t('writing.freeGuide')}</p>
      )}

      <div className="flex gap-3">
        <GameButton onClick={clearCanvas} color="yellow">{t('writing.clear')}</GameButton>
        <GameButton onClick={nextLetter} color="green">{t('writing.skip')}</GameButton>
      </div>

      <GameButton onClick={() => router.push('/games')} color="green">{t('backToGames')}</GameButton>
    </div>
  )
}
