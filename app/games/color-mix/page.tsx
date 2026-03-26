'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

const COLOR_COMBOS = [
  { a: 'Red', b: 'Yellow', answer: 'Orange', aColor: '#EF4444', bColor: '#EAB308', answerColor: '#F97316' },
  { a: 'Blue', b: 'Yellow', answer: 'Green', aColor: '#3B82F6', bColor: '#EAB308', answerColor: '#22C55E' },
  { a: 'Red', b: 'Blue', answer: 'Purple', aColor: '#EF4444', bColor: '#3B82F6', answerColor: '#A855F7' },
  { a: 'White', b: 'Red', answer: 'Pink', aColor: '#F5F5F5', bColor: '#EF4444', answerColor: '#EC4899' },
  { a: 'Blue', b: 'White', answer: 'Light Blue', aColor: '#3B82F6', bColor: '#F5F5F5', answerColor: '#38BDF8' },
  { a: 'Red', b: 'Green', answer: 'Brown', aColor: '#EF4444', bColor: '#22C55E', answerColor: '#92400E' },
  { a: 'Yellow', b: 'White', answer: 'Light Yellow', aColor: '#EAB308', bColor: '#F5F5F5', answerColor: '#FDE68A' },
]

const CHOICES = ['Orange', 'Green', 'Purple', 'Pink', 'Light Blue', 'Brown', 'Light Yellow']

function getRandomCombo() {
  return COLOR_COMBOS[Math.floor(Math.random() * COLOR_COMBOS.length)]
}

function getChoices(correctAnswer: string) {
  const wrong = CHOICES.filter(c => c !== correctAnswer)
  const shuffled = wrong.sort(() => Math.random() - 0.5).slice(0, 3)
  const all = [...shuffled, correctAnswer].sort(() => Math.random() - 0.5)
  return all
}

export default function ColorMixGame() {
  const router = useRouter()
  const [combo, setCombo] = useState(getRandomCombo)
  const [choices, setChoices] = useState(() => getChoices(combo.answer))
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleChoice = (choice: string) => {
    if (feedback) return
    if (choice === combo.answer) {
      setScore(s => s + 1)
      setFeedback(randomCheer())
      setIsCorrect(true)
      setTimeout(() => {
        const next = getRandomCombo()
        setCombo(next)
        setChoices(getChoices(next.answer))
        setFeedback(null)
        setIsCorrect(false)
      }, 1200)
    } else {
      setFeedback('Not quite! Try again! 💪')
      setIsCorrect(false)
      setTimeout(() => setFeedback(null), 1000)
    }
  }

  return (
    <GameLayout>
      <GameHeader title="Color Mix! 🎨" score={score} />

      <GameCard color={isCorrect ? 'green' : 'purple'}>
        {/* Color blobs */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border-4 border-white/30" style={{ backgroundColor: combo.aColor }} />
          <span className="text-3xl font-black text-white">+</span>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border-4 border-white/30" style={{ backgroundColor: combo.bColor }} />
          <span className="text-3xl font-black text-white">=</span>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border-4 border-white/30 flex items-center justify-center" style={{ backgroundColor: isCorrect ? combo.answerColor : '#374151' }}>
            {!isCorrect && <span className="text-3xl">?</span>}
          </div>
        </div>

        <p className="text-xl font-bold text-white mb-2">{combo.a} + {combo.b} = ?</p>

        {feedback && (
          <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
            {feedback}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {choices.map(choice => (
            <GameButton
              key={choice}
              onClick={() => handleChoice(choice)}
              color="blue"
              size="md"
            >
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
