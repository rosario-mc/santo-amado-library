'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

const COLORS = [
  { name: 'green', bg: '#22C55E' },
  { name: 'red', bg: '#EF4444' },
  { name: 'blue', bg: '#3B82F6' },
  { name: 'yellow', bg: '#EAB308' },
]

export default function SimonSaysGame() {
  const router = useRouter()
  const [sequence, setSequence] = useState<number[]>([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [activeButton, setActiveButton] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout[]>([])

  const clearTimeouts = () => {
    timeoutRef.current.forEach(t => clearTimeout(t))
    timeoutRef.current = []
  }

  const playSequence = useCallback((seq: number[]) => {
    setIsShowingSequence(true)
    clearTimeouts()

    seq.forEach((colorIdx, i) => {
      const t1 = setTimeout(() => setActiveButton(colorIdx), i * 700)
      const t2 = setTimeout(() => setActiveButton(null), i * 700 + 400)
      timeoutRef.current.push(t1, t2)
    })

    const t3 = setTimeout(() => {
      setIsShowingSequence(false)
      setIsPlaying(true)
    }, seq.length * 700 + 200)
    timeoutRef.current.push(t3)
  }, [])

  const startNewRound = useCallback(() => {
    const nextColor = Math.floor(Math.random() * 4)
    const newSeq = [...sequence, nextColor]
    setSequence(newSeq)
    setPlayerIndex(0)
    setIsPlaying(false)
    setFeedback(null)
    playSequence(newSeq)
  }, [sequence, playSequence])

  const startGame = () => {
    setGameStarted(true)
    setScore(0)
    setSequence([])
    const firstColor = Math.floor(Math.random() * 4)
    const newSeq = [firstColor]
    setSequence(newSeq)
    setPlayerIndex(0)
    setFeedback(null)
    playSequence(newSeq)
  }

  const handlePress = useCallback((colorIdx: number) => {
    if (!isPlaying || isShowingSequence) return

    setActiveButton(colorIdx)
    setTimeout(() => setActiveButton(null), 200)

    if (colorIdx === sequence[playerIndex]) {
      if (playerIndex === sequence.length - 1) {
        setScore(s => s + 1)
        setFeedback(randomCheer())
        setIsPlaying(false)
        setTimeout(() => startNewRound(), 1200)
      } else {
        setPlayerIndex(p => p + 1)
      }
    } else {
      setFeedback(`Game Over! You got ${sequence.length - 1} rounds! 🎮`)
      setIsPlaying(false)
      setGameStarted(false)
      clearTimeouts()
    }
  }, [isPlaying, isShowingSequence, sequence, playerIndex, startNewRound])

  useEffect(() => {
    return () => clearTimeouts()
  }, [])

  return (
    <GameLayout>
      <GameHeader title="Simon Says! 🧠" score={score} />

      <GameCard color="indigo">
        {!gameStarted ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-white/70">Watch the pattern, then repeat it!</p>
            {feedback && <p className="text-xl font-bold text-orange-400">{feedback}</p>}
            <GameButton onClick={startGame} color="green" size="lg">
              {feedback ? 'Play Again! 🔄' : 'Start! 🚀'}
            </GameButton>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-white/50 mb-4">
              {isShowingSequence ? 'Watch carefully...' : isPlaying ? 'Your turn!' : ''}
            </p>

            {feedback && !isShowingSequence && (
              <p className="text-2xl font-bold text-green-400 mb-4">{feedback}</p>
            )}

            <div className="grid grid-cols-2 gap-4 w-fit mx-auto">
              {COLORS.map((color, i) => (
                <button
                  key={color.name}
                  onClick={() => handlePress(i)}
                  disabled={!isPlaying}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white/20 transition-all duration-150 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: color.bg,
                    opacity: activeButton === i ? 1 : 0.5,
                    transform: activeButton === i ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: activeButton === i ? `0 0 30px ${color.bg}` : 'none',
                  }}
                />
              ))}
            </div>

            <p className="text-sm text-white/40 mt-4 font-bold">Round: {sequence.length}</p>
          </>
        )}
      </GameCard>

      <GameButton onClick={() => router.push('/games')} color="green">
        Back to Games 🎮
      </GameButton>
    </GameLayout>
  )
}
