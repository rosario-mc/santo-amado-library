'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer, speakWord as speakWordUtil } from '@/lib/games'
import { GameLayout, GameHeader, GameCard, GameButton } from '@/components/ui'

const WORDS = [
  'cat', 'dog', 'sun', 'hat', 'run', 'big', 'red', 'cup', 'mom', 'dad',
  'bat', 'pig', 'hop', 'bed', 'bus', 'map', 'pen', 'leg', 'sit', 'top',
  'fox', 'box', 'bug', 'hug', 'mug', 'rug', 'tub', 'fan', 'van', 'jam',
]

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

export default function TypingGame() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [currentWord, setCurrentWord] = useState(pickWord)
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  const speakWord = speakWordUtil

  // Speak the word when it changes
  useEffect(() => {
    inputRef.current?.focus()
    speakWord(currentWord)
  }, [currentWord])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()

    // Check if they completed the word
    if (value.trimEnd() === currentWord) {
      setScore((s) => s + 1)
      setFeedback(randomCheer())
      setUserInput('')
      setTimeout(() => {
        setFeedback(null)
        setCurrentWord(pickWord())
        inputRef.current?.focus()
      }, 1000)
    } else {
      setUserInput(value)
    }
  }

  // Render the word with color-coded letters
  const renderWord = () => {
    return currentWord.split('').map((char, i) => {
      let className = 'text-zinc-600' // not typed yet
      if (i < userInput.length) {
        className = userInput[i] === char ? 'text-green-500' : 'text-red-400'
      }
      return (
        <span key={i} className={`text-5xl sm:text-7xl font-bold font-mono tracking-[0.2em] ${className} transition-colors`}>
          {char}
        </span>
      )
    })
  }

  // Show letter hint as keyboard-like buttons
  const renderLetterHint = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {currentWord.split('').map((char, i) => (
          <div
            key={i}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold border-2 transition-colors ${
              i < userInput.length
                ? userInput[i] === char
                  ? 'border-green-400 bg-green-100 text-green-600'
                  : 'border-red-300 bg-red-100 text-red-500'
                : 'border-zinc-200 bg-white text-zinc-300'
            }`}
          >
            {i < userInput.length ? char : '?'}
          </div>
        ))}
      </div>
    )
  }

  return (
    <GameLayout>
      <GameHeader title="Type It! ⌨️" score={score} />

      <GameCard color={feedback ? 'green' : 'blue'}>
        {/* Word display */}
        <div className="mb-4">
          {renderWord()}
        </div>

        {/* Hear it again button */}
        <GameButton onClick={() => speakWord(currentWord)} color="blue" size="sm" className="mb-4 rounded-full">
          Hear it again 🔊
        </GameButton>

        {/* Letter boxes hint */}
        {renderLetterHint()}

        {/* Feedback */}
        {feedback && (
          <p className="text-2xl sm:text-3xl font-bold text-green-500 mt-6">
            {feedback}
          </p>
        )}

        {/* Input */}
        {!feedback && (
          <div className="mt-6">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              className="w-full max-w-[200px] text-center text-3xl sm:text-4xl font-bold font-mono border-4 border-blue-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 text-black tracking-widest"
              placeholder="type..."
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <p className="text-sm text-zinc-400 mt-3">Listen to the word and type it!</p>
          </div>
        )}
      </GameCard>

      <GameButton onClick={() => router.push('/games')} color="blue">
        Back to Games 🎮
      </GameButton>
    </GameLayout>
  )
}
