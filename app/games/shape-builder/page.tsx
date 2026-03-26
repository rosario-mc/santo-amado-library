'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

const SHAPES = [
  { name: 'Circle', svg: <circle cx="50" cy="50" r="40" />, color: '#EF4444' },
  { name: 'Square', svg: <rect x="10" y="10" width="80" height="80" />, color: '#3B82F6' },
  { name: 'Triangle', svg: <polygon points="50,10 90,90 10,90" />, color: '#22C55E' },
  { name: 'Star', svg: <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />, color: '#EAB308' },
  { name: 'Diamond', svg: <polygon points="50,5 95,50 50,95 5,50" />, color: '#A855F7' },
  { name: 'Heart', svg: <path d="M50,85 C20,60 5,40 15,25 C25,10 40,15 50,30 C60,15 75,10 85,25 C95,40 80,60 50,85Z" />, color: '#EC4899' },
]

function getRandomShape() {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)]
}

function getChoices(correct: string) {
  const others = SHAPES.filter(s => s.name !== correct).sort(() => Math.random() - 0.5).slice(0, 3)
  const all = [...others.map(s => s.name), correct].sort(() => Math.random() - 0.5)
  return all
}

export default function ShapeBuilderGame() {
  const router = useRouter()
  const [shape, setShape] = useState(getRandomShape)
  const [choices, setChoices] = useState(() => getChoices(shape.name))
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleChoice = useCallback((choice: string) => {
    if (feedback) return
    if (choice === shape.name) {
      setScore(s => s + 1)
      setFeedback(randomCheer())
      setIsCorrect(true)
      setTimeout(() => {
        const next = getRandomShape()
        setShape(next)
        setChoices(getChoices(next.name))
        setFeedback(null)
        setIsCorrect(false)
      }, 1200)
    } else {
      setFeedback('Try another one! 🤔')
      setIsCorrect(false)
      setTimeout(() => setFeedback(null), 1000)
    }
  }, [feedback, shape.name])

  return (
    <GameLayout>
      <GameHeader title="Shape Builder! 🔷" score={score} />

      <GameCard color={isCorrect ? 'green' : 'indigo'}>
        <p className="text-lg font-bold text-white/60 mb-4">What shape is this?</p>

        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 100 100" className="w-32 h-32 sm:w-40 sm:h-40 drop-shadow-lg">
            <g fill={shape.color} stroke="white" strokeWidth="2">{shape.svg}</g>
          </svg>
        </div>

        {feedback && (
          <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
            {feedback}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {choices.map(choice => (
            <GameButton key={choice} onClick={() => handleChoice(choice)} color="blue" size="md">
              {choice}
            </GameButton>
          ))}
        </div>
      </GameCard>

      <GameButton onClick={() => router.push('/games')} color="green">
        Back to Games 🎮
      </GameButton>
    </GameLayout>
  )
}
