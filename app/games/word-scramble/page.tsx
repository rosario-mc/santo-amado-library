'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer, speakWord } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

const WORDS = [
  'CAT', 'DOG', 'SUN', 'HAT', 'BIG', 'RUN', 'RED', 'CUP', 'BUS', 'PIG',
  'FISH', 'STAR', 'TREE', 'BOOK', 'CAKE', 'FROG', 'SHIP', 'BIRD', 'MOON', 'BEAR',
]

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function WordScrambleGame() {
  const router = useRouter()
  const [word, setWord] = useState(getRandomWord)
  const [scrambled, setScrambled] = useState<string[]>(() => shuffleArray(word.split('')))
  const [placed, setPlaced] = useState<(string | null)[]>(() => Array(word.length).fill(null))
  const [available, setAvailable] = useState<boolean[]>(() => Array(word.length).fill(true))
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)

  const nextSlot = placed.indexOf(null)

  const handleLetterClick = useCallback((index: number) => {
    if (feedback || !available[index] || nextSlot === -1) return

    const newPlaced = [...placed]
    newPlaced[nextSlot] = scrambled[index]
    setPlaced(newPlaced)

    const newAvailable = [...available]
    newAvailable[index] = false
    setAvailable(newAvailable)

    // Check if word is complete
    if (newPlaced.every(l => l !== null)) {
      const attempt = newPlaced.join('')
      if (attempt === word) {
        setScore(s => s + 1)
        setFeedback(randomCheer())
        setIsCorrect(true)
        speakWord(word)
        setTimeout(() => {
          const next = getRandomWord()
          setWord(next)
          setScrambled(shuffleArray(next.split('')))
          setPlaced(Array(next.length).fill(null))
          setAvailable(Array(next.length).fill(true))
          setFeedback(null)
          setIsCorrect(false)
        }, 1500)
      } else {
        setFeedback('Not quite! Try again! 💪')
        setIsCorrect(false)
        setTimeout(() => {
          setPlaced(Array(word.length).fill(null))
          setAvailable(Array(word.length).fill(true))
          setFeedback(null)
        }, 1000)
      }
    }
  }, [feedback, available, nextSlot, placed, scrambled, word])

  const handleUndo = () => {
    if (feedback) return
    const lastPlacedIdx = placed.reduce((last, val, i) => val !== null ? i : last, -1)
    if (lastPlacedIdx === -1) return

    const letter = placed[lastPlacedIdx]
    const scrambledIdx = scrambled.findIndex((s, i) => s === letter && !available[i])

    const newPlaced = [...placed]
    newPlaced[lastPlacedIdx] = null
    setPlaced(newPlaced)

    if (scrambledIdx !== -1) {
      const newAvailable = [...available]
      newAvailable[scrambledIdx] = true
      setAvailable(newAvailable)
    }
  }

  return (
    <GameLayout>
      <GameHeader title="Word Scramble! 🔤" score={score} />

      <GameCard color={isCorrect ? 'green' : 'yellow'}>
        <p className="text-lg font-bold text-white/60 mb-4">Unscramble the word!</p>

        {/* Placed letters (answer slots) */}
        <div className="flex justify-center gap-2 mb-6">
          {placed.map((letter, i) => (
            <div
              key={i}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-3 flex items-center justify-center text-2xl sm:text-3xl font-black ${
                letter
                  ? 'bg-[#FFD93D] border-[#EAB308] text-[#5C3D1E]'
                  : 'bg-white/10 border-white/30 border-dashed'
              }`}
            >
              {letter || ''}
            </div>
          ))}
        </div>

        {feedback && (
          <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
            {feedback}
          </p>
        )}

        {/* Scrambled letters to pick from */}
        <div className="flex justify-center gap-2 mb-4">
          {scrambled.map((letter, i) => (
            <button
              key={i}
              onClick={() => handleLetterClick(i)}
              disabled={!available[i]}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-3 text-2xl sm:text-3xl font-black transition-all ${
                available[i]
                  ? 'bg-white border-gray-300 text-black shadow-[0_4px_0_#9CA3AF] hover:shadow-[0_2px_0_#9CA3AF] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] cursor-pointer'
                  : 'opacity-20 cursor-not-allowed bg-white/20 border-white/10 text-white/20'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        <GameButton onClick={handleUndo} color="orange" size="sm">
          Undo ↩️
        </GameButton>
      </GameCard>

      <GameButton onClick={() => router.push('/games')} color="green">
        Back to Games 🎮
      </GameButton>
    </GameLayout>
  )
}
