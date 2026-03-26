'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

function generateProblem() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * a) + 1 // b <= a so no negatives
  return { a, b, answer: a - b }
}

export default function SubtractionGame() {
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
      setScore(s => s + 1)
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

  // Render dots with crossed-out ones
  const renderDots = () => (
    <div className="flex flex-wrap justify-center gap-2 max-w-[280px] mb-4">
      {Array.from({ length: problem.a }).map((_, i) => (
        <div key={i} className="relative">
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 ${
            i < problem.a - problem.b
              ? 'bg-green-400 border-green-500'
              : 'bg-red-400 border-red-500 opacity-40'
          }`} />
          {i >= problem.a - problem.b && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-red-600 rotate-45" />
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <GameLayout>
      <GameHeader title="Subtraction! ➖" score={score} />

      <GameCard color={feedback && !showTryAgain ? 'green' : showTryAgain ? 'orange' : 'blue'}>
        {renderDots()}

        <p className="text-3xl sm:text-4xl font-bold text-white mb-6">
          {problem.a} - {problem.b} = ?
        </p>

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
