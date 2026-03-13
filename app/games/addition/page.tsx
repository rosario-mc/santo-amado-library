'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

function generateProblem() {
  const a = Math.floor(Math.random() * 6) + 1 // 1-6
  const b = Math.floor(Math.random() * 6) + 1 // 1-6
  return { a, b, answer: a + b }
}

export default function AdditionGame() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [problem, setProblem] = useState(generateProblem)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showTryAgain, setShowTryAgain] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userAnswer === '') return

    const parsed = parseInt(userAnswer, 10)
    if (parsed === problem.answer) {
      setScore((s) => s + 1)
      setFeedback(randomCheer())
      setShowTryAgain(false)
      setTimeout(() => {
        setFeedback(null)
        setProblem(generateProblem())
        setUserAnswer('')
        inputRef.current?.focus()
      }, 1200)
    } else {
      setShowTryAgain(true)
      setFeedback('Oops, try again! 💪')
      setUserAnswer('')
      inputRef.current?.focus()
    }
  }

  // Render dots to help kids count
  const renderDots = (count: number) => (
    <div className="flex flex-wrap justify-center gap-2.5 max-w-[200px]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-yellow-400 border-2 border-yellow-500" />
      ))}
    </div>
  )

  return (
    <GameLayout>
      <GameHeader title="Adding Fun! ➕" score={score} />

      {/* Problem card */}
      <GameCard
        color={feedback && !showTryAgain ? 'green' : showTryAgain ? 'orange' : 'purple'}
      >
        {/* Visual dots */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {renderDots(problem.a)}
          <span className="text-4xl font-bold text-black">+</span>
          {renderDots(problem.b)}
        </div>

        {/* Number problem */}
        <p className="text-3xl sm:text-4xl font-bold text-black mb-6">
          {problem.a} + {problem.b} = ?
        </p>

        {/* Feedback */}
        {feedback && (
          <p className={`text-2xl sm:text-3xl font-bold mb-4 ${showTryAgain ? 'text-orange-500' : 'text-green-500'}`}>
            {feedback}
          </p>
        )}

        {/* Input */}
        {(!feedback || showTryAgain) && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            <input
              ref={inputRef}
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-32 text-center text-4xl sm:text-5xl font-bold border-4 border-purple-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 text-black"
              placeholder="?"
              autoFocus
            />
            <GameButton type="submit" color="purple" size="lg">
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
