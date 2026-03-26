'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

const EMOJIS = ['🐶', '🐱', '🐸', '🌟', '🍎', '🚗', '🎈', '🐟', '🌻', '🦋']

function generateProblem(maxCount: number) {
  const count = Math.floor(Math.random() * maxCount) + 1
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  return { count, emoji }
}

export default function CountingGame() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [level, setLevel] = useState(1)
  const maxCount = Math.min(5 + level * 2, 20)
  const [problem, setProblem] = useState(() => generateProblem(maxCount))
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showTryAgain, setShowTryAgain] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userAnswer === '') return

    const parsed = parseInt(userAnswer, 10)
    if (parsed === problem.count) {
      setScore(s => s + 1)
      setFeedback(randomCheer())
      setShowTryAgain(false)
      if (score > 0 && score % 3 === 0) setLevel(l => l + 1)
      setTimeout(() => {
        setFeedback(null)
        setProblem(generateProblem(maxCount))
        setUserAnswer('')
        inputRef.current?.focus()
      }, 1200)
    } else {
      setShowTryAgain(true)
      setFeedback('Count again! 💪')
      setUserAnswer('')
      inputRef.current?.focus()
    }
  }

  return (
    <GameLayout>
      <GameHeader title="Counting! 🔢" score={score} />

      <GameCard color={feedback && !showTryAgain ? 'green' : showTryAgain ? 'orange' : 'blue'}>
        <p className="text-lg font-bold text-white/60 mb-4">How many {problem.emoji} do you see?</p>

        <div className="flex flex-wrap justify-center gap-3 mb-6 max-w-[320px] mx-auto">
          {Array.from({ length: problem.count }).map((_, i) => (
            <span key={i} className="text-4xl sm:text-5xl">{problem.emoji}</span>
          ))}
        </div>

        {feedback && (
          <p className={`text-2xl font-bold mb-4 ${showTryAgain ? 'text-orange-400' : 'text-green-400'}`}>
            {feedback}
          </p>
        )}

        {(!feedback || showTryAgain) && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            <input
              ref={inputRef}
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-32 text-center text-4xl font-bold border-4 border-blue-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 text-black"
              placeholder="?"
              autoFocus
            />
            <GameButton type="submit" color="blue" size="lg">
              Check! ✅
            </GameButton>
          </form>
        )}
      </GameCard>

      <GameButton onClick={() => router.push('/games')} color="green">
        Back to Games 🎮
      </GameButton>
    </GameLayout>
  )
}
