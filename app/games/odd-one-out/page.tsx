'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

interface Puzzle {
  category: string
  items: string[]
  oddIndex: number
  explanation: string
}

const PUZZLES: Puzzle[] = [
  { category: 'Fruits', items: ['🍎', '🍌', '🍊', '🚗'], oddIndex: 3, explanation: 'A car is not a fruit!' },
  { category: 'Animals', items: ['🐶', '🌻', '🐱', '🐸'], oddIndex: 1, explanation: 'A flower is not an animal!' },
  { category: 'Vehicles', items: ['🚗', '🚀', '🎈', '🚌'], oddIndex: 2, explanation: 'A balloon is not a vehicle!' },
  { category: 'Food', items: ['🍕', '🍔', '🎸', '🌮'], oddIndex: 2, explanation: 'A guitar is not food!' },
  { category: 'Sea creatures', items: ['🐟', '🦀', '🐙', '🐶'], oddIndex: 3, explanation: 'A dog is not a sea creature!' },
  { category: 'Sports', items: ['⚽', '🏀', '🎾', '🍰'], oddIndex: 3, explanation: 'Cake is not a sport!' },
  { category: 'Weather', items: ['☀️', '🌧️', '❄️', '🐱'], oddIndex: 3, explanation: 'A cat is not weather!' },
  { category: 'Insects', items: ['🐛', '🦋', '🐝', '🐘'], oddIndex: 3, explanation: 'An elephant is not an insect!' },
  { category: 'Flowers', items: ['🌸', '🌹', '🌻', '🔥'], oddIndex: 3, explanation: 'Fire is not a flower!' },
  { category: 'Trees', items: ['🌲', '🎄', '🌴', '🍕'], oddIndex: 3, explanation: 'Pizza is not a tree!' },
  { category: 'Birds', items: ['🦅', '🐦', '🐧', '🐍'], oddIndex: 3, explanation: 'A snake is not a bird!' },
  { category: 'Tools', items: ['🔨', '🪛', '🔧', '🎵'], oddIndex: 3, explanation: 'Music is not a tool!' },
]

function getRandomPuzzle(): Puzzle {
  const puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
  // Shuffle items but track the odd one
  const oddItem = puzzle.items[puzzle.oddIndex]
  const shuffled = [...puzzle.items].sort(() => Math.random() - 0.5)
  const newOddIndex = shuffled.indexOf(oddItem)
  return { ...puzzle, items: shuffled, oddIndex: newOddIndex }
}

export default function OddOneOutGame() {
  const router = useRouter()
  const [puzzle, setPuzzle] = useState(getRandomPuzzle)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleChoice = useCallback((index: number) => {
    if (feedback) return
    setSelectedIndex(index)

    if (index === puzzle.oddIndex) {
      setScore(s => s + 1)
      setFeedback(randomCheer())
      setIsCorrect(true)
      setTimeout(() => {
        setPuzzle(getRandomPuzzle())
        setFeedback(null)
        setIsCorrect(false)
        setSelectedIndex(null)
      }, 1500)
    } else {
      setFeedback('Not that one! Try again! 🤔')
      setIsCorrect(false)
      setTimeout(() => {
        setFeedback(null)
        setSelectedIndex(null)
      }, 1000)
    }
  }, [feedback, puzzle.oddIndex])

  return (
    <GameLayout>
      <GameHeader title="Odd One Out! 👀" score={score} />

      <GameCard color={isCorrect ? 'green' : 'purple'}>
        <p className="text-lg font-bold text-white/60 mb-2">Which one doesn&apos;t belong?</p>
        <p className="text-sm text-white/40 mb-6">Find the odd one out!</p>

        <div className="grid grid-cols-2 gap-4 mb-4 w-fit mx-auto">
          {puzzle.items.map((item, i) => (
            <button
              key={i}
              onClick={() => handleChoice(i)}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 text-5xl sm:text-6xl flex items-center justify-center transition-all ${
                selectedIndex === i && isCorrect
                  ? 'border-green-400 bg-green-500/20 scale-110'
                  : selectedIndex === i && !isCorrect
                  ? 'border-red-400 bg-red-500/20 animate-shake'
                  : 'border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/40'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {feedback && (
          <div className="mt-2">
            <p className={`text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
              {feedback}
            </p>
            {isCorrect && (
              <p className="text-sm text-white/50 mt-1">{puzzle.explanation}</p>
            )}
          </div>
        )}
      </GameCard>

      <GameButton onClick={() => router.push('/games')} color="green">
        Back to Games 🎮
      </GameButton>
    </GameLayout>
  )
}
