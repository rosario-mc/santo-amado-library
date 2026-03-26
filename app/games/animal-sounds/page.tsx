'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

const ANIMALS = [
  { name: 'Cow', emoji: '🐄', sound: 'Moo!' },
  { name: 'Cat', emoji: '🐱', sound: 'Meow!' },
  { name: 'Dog', emoji: '🐶', sound: 'Woof!' },
  { name: 'Duck', emoji: '🦆', sound: 'Quack!' },
  { name: 'Pig', emoji: '🐷', sound: 'Oink!' },
  { name: 'Rooster', emoji: '🐓', sound: 'Cock-a-doodle-doo!' },
  { name: 'Sheep', emoji: '🐑', sound: 'Baa!' },
  { name: 'Horse', emoji: '🐴', sound: 'Neigh!' },
  { name: 'Lion', emoji: '🦁', sound: 'Roar!' },
  { name: 'Frog', emoji: '🐸', sound: 'Ribbit!' },
  { name: 'Owl', emoji: '🦉', sound: 'Hoot!' },
  { name: 'Snake', emoji: '🐍', sound: 'Hiss!' },
]

function getRandomAnimal() {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
}

function getChoices(correct: string) {
  const others = ANIMALS.filter(a => a.name !== correct).sort(() => Math.random() - 0.5).slice(0, 3)
  const all = [...others, ANIMALS.find(a => a.name === correct)!].sort(() => Math.random() - 0.5)
  return all
}

function speakSound(text: string) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.7
  utterance.pitch = 1.2
  window.speechSynthesis.speak(utterance)
}

export default function AnimalSoundsGame() {
  const router = useRouter()
  const [animal, setAnimal] = useState(getRandomAnimal)
  const [choices, setChoices] = useState(() => getChoices(animal.name))
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const playSound = useCallback(() => {
    speakSound(animal.sound)
  }, [animal])

  const handleChoice = (chosen: typeof ANIMALS[0]) => {
    if (feedback) return
    if (chosen.name === animal.name) {
      setScore(s => s + 1)
      setFeedback(randomCheer())
      setIsCorrect(true)
      setRevealed(true)
      setTimeout(() => {
        const next = getRandomAnimal()
        setAnimal(next)
        setChoices(getChoices(next.name))
        setFeedback(null)
        setIsCorrect(false)
        setRevealed(false)
      }, 1500)
    } else {
      setFeedback('Listen again! 👂')
      setIsCorrect(false)
      setTimeout(() => setFeedback(null), 1000)
    }
  }

  return (
    <GameLayout>
      <GameHeader title="Animal Sounds! 🔊" score={score} />

      <GameCard color={isCorrect ? 'green' : 'orange'}>
        <p className="text-lg font-bold text-white/60 mb-2">Which animal makes this sound?</p>

        {/* Sound display */}
        <div className="flex flex-col items-center gap-3 mb-6">
          {revealed ? (
            <span className="text-8xl">{animal.emoji}</span>
          ) : (
            <div className="w-28 h-28 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center">
              <span className="text-5xl">🔊</span>
            </div>
          )}
          <p className="text-2xl font-black text-[#FFD93D]">&quot;{animal.sound}&quot;</p>
          <GameButton onClick={playSound} color="yellow" size="sm">
            Hear it! 🔊
          </GameButton>
        </div>

        {feedback && (
          <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
            {feedback}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {choices.map(choice => (
            <button
              key={choice.name}
              onClick={() => handleChoice(choice)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transition-all"
            >
              <span className="text-4xl">{choice.emoji}</span>
              <span className="text-sm font-bold text-white">{choice.name}</span>
            </button>
          ))}
        </div>
      </GameCard>

      <GameButton onClick={() => router.push('/games')} color="green">
        Back to Games 🎮
      </GameButton>
    </GameLayout>
  )
}
