'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer, speakWord } from '@/lib/games'
import { GameLayout, GameHeader, GameButton } from '@/components/ui'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Threshold: what % of the guide letter pixels need to be covered
const MATCH_THRESHOLD = 35

export default function WritingGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const guideCanvasRef = useRef<HTMLCanvasElement>(null)
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [mode, setMode] = useState<'trace' | 'free'>('trace')
  const [canvasSize, setCanvasSize] = useState(300)
  const [hasDrawn, setHasDrawn] = useState(false)
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentLetter = LETTERS[currentLetterIndex]

  // Responsive canvas size
  useEffect(() => {
    const updateSize = () => {
      const size = Math.min(window.innerWidth - 64, 350)
      setCanvasSize(size)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Render the target letter onto the hidden guide canvas for comparison
  const renderGuideCanvas = useCallback(() => {
    const guide = guideCanvasRef.current
    if (!guide) return
    guide.width = canvasSize
    guide.height = canvasSize
    const ctx = guide.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, guide.width, guide.height)
    ctx.fillStyle = '#000'
    ctx.font = `bold ${guide.width * 0.7}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(currentLetter, guide.width / 2, guide.height / 2)
  }, [currentLetter, canvasSize])

  // Draw the visible guide letter on the main canvas
  const drawGuideLetter = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Ruled lines
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, canvas.height * 0.3)
    ctx.lineTo(canvas.width, canvas.height * 0.3)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, canvas.height * 0.7)
    ctx.lineTo(canvas.width, canvas.height * 0.7)
    ctx.stroke()
    ctx.setLineDash([])

    if (mode === 'trace') {
      // Draw faded guide letter
      ctx.font = `bold ${canvas.width * 0.7}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(200, 200, 255, 0.35)'
      ctx.fillText(currentLetter, canvas.width / 2, canvas.height / 2)

      // Dotted outline for tracing
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(130, 130, 200, 0.5)'
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

  // Check if the drawing matches the guide letter
  const checkDrawing = useCallback(() => {
    const canvas = canvasRef.current
    const guide = guideCanvasRef.current
    if (!canvas || !guide) return

    const ctx = canvas.getContext('2d')
    const guideCtx = guide.getContext('2d')
    if (!ctx || !guideCtx) return

    const drawnData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const guideData = guideCtx.getImageData(0, 0, guide.width, guide.height).data

    let guidePixels = 0
    let coveredPixels = 0

    // Count how many of the guide letter's pixels were drawn over
    for (let i = 0; i < guideData.length; i += 4) {
      const guideAlpha = guideData[i + 3]
      if (guideAlpha > 128) {
        guidePixels++
        // Check if the user drew here (look for the indigo drawing color)
        const r = drawnData[i]
        const g = drawnData[i + 1]
        const b = drawnData[i + 2]
        // The drawing color is #4F46E5 (79, 70, 229)
        // Be generous - check if the pixel is bluish/purple (not white, not the faded guide)
        if (b > 150 && r < 150 && g < 150) {
          coveredPixels++
        }
      }
    }

    if (guidePixels === 0) return

    const coverage = (coveredPixels / guidePixels) * 100

    if (coverage >= MATCH_THRESHOLD) {
      // Success!
      setScore((s) => s + 1)
      setFeedback(randomCheer())
      setTimeout(() => {
        setFeedback(null)
        setCurrentLetterIndex((i) => (i + 1) % LETTERS.length)
      }, 1200)
    }
  }, [canvasSize])

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    }
  }

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    setHasDrawn(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#4F46E5'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([])

    // Clear any pending check
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    ctx.strokeStyle = '#4F46E5'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([])
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    setIsDrawing(false)

    // Check after a short pause (let them finish multiple strokes)
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }
    checkTimeoutRef.current = setTimeout(() => {
      checkDrawing()
    }, 800)
  }

  const clearCanvas = () => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }
    setHasDrawn(false)
    drawGuideLetter()
  }

  const nextLetter = () => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }
    setScore((s) => s + 1)
    setFeedback(randomCheer())
    setTimeout(() => {
      setFeedback(null)
      setCurrentLetterIndex((i) => (i + 1) % LETTERS.length)
    }, 1000)
  }

  const prevLetter = () => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }
    setCurrentLetterIndex((i) => (i - 1 + LETTERS.length) % LETTERS.length)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 py-6">
      <GameHeader title="Write It! ✏️" score={score} />

      {/* Mode toggle */}
      <div className="flex gap-2">
        <GameButton
          onClick={() => setMode('trace')}
          color={mode === 'trace' ? 'indigo' : 'black'}
          size="sm"
          className="rounded-full"
        >
          Trace Mode
        </GameButton>
        <GameButton
          onClick={() => setMode('free')}
          color={mode === 'free' ? 'indigo' : 'black'}
          size="sm"
          className="rounded-full"
        >
          Free Write
        </GameButton>
      </div>

      {/* Current letter display and nav */}
      <div className="flex items-center gap-4">
        <GameButton onClick={prevLetter} color="orange" size="sm" className="w-10 h-10 rounded-full !p-0 flex items-center justify-center">
          &#8249;
        </GameButton>
        <div className="text-center">
          <p className="text-6xl sm:text-8xl font-bold text-indigo-600">{currentLetter}</p>
          <p className="text-lg text-zinc-400 font-mono">{currentLetter.toLowerCase()}</p>
        </div>
        <GameButton onClick={() => speakWord(currentLetter)} color="blue" size="sm" className="w-10 h-10 rounded-full !p-0 flex items-center justify-center">
          🔊
        </GameButton>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className="text-2xl font-bold text-green-500 animate-bounce">{feedback}</p>
      )}

      {/* Drawing canvas */}
      <div className="rounded-2xl border-4 border-indigo-300 overflow-hidden shadow-lg bg-white relative">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {/* Hidden guide canvas for pixel comparison */}
        <canvas
          ref={guideCanvasRef}
          width={canvasSize}
          height={canvasSize}
          className="hidden"
        />
      </div>

      {/* Hint text */}
      {!hasDrawn && !feedback && (
        <p className="text-sm text-zinc-400">
          {mode === 'trace' ? 'Trace the letter above!' : 'Write the letter you see!'}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <GameButton onClick={clearCanvas} color="yellow">
          Clear 🧹
        </GameButton>
        <GameButton onClick={nextLetter} color="green">
          Skip ➡️
        </GameButton>
      </div>

      <GameButton onClick={() => router.push('/games')} color="indigo">
        Back to Games 🎮
      </GameButton>
    </div>
  )
}
