'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { randomCheer, speakWord as speakWordUtil } from '@/lib/games'
import { GameLayout, GameCard, GameButton } from '@/components/ui'

const CARD_SETS = [
  { emoji: '🐶', name: 'dog' },
  { emoji: '🐱', name: 'cat' },
  { emoji: '🐸', name: 'frog' },
  { emoji: '🦋', name: 'butterfly' },
  { emoji: '🐢', name: 'turtle' },
  { emoji: '🐙', name: 'octopus' },
  { emoji: '🦕', name: 'dinosaur' },
  { emoji: '🐘', name: 'elephant' },
  { emoji: '🦊', name: 'fox' },
  { emoji: '🐧', name: 'penguin' },
  { emoji: '🌈', name: 'rainbow' },
  { emoji: '⭐', name: 'star' },
]

interface Card {
  id: number
  emoji: string
  name: string
  isFlipped: boolean
  isMatched: boolean
}

type GridSize = 'small' | 'medium' | 'large'

const GRID_CONFIG = {
  small: { pairs: 4, label: '4 Pairs', cols: 'grid-cols-4' },
  medium: { pairs: 6, label: '6 Pairs', cols: 'grid-cols-4' },
  large: { pairs: 8, label: '8 Pairs', cols: 'grid-cols-4' },
}

function createBoard(pairCount: number): Card[] {
  const shuffled = [...CARD_SETS].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, pairCount)
  const cards: Card[] = []

  selected.forEach((item, index) => {
    cards.push({ id: index * 2, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false })
    cards.push({ id: index * 2 + 1, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false })
  })

  return cards.sort(() => Math.random() - 0.5)
}

export default function MatchingGame() {
  const router = useRouter()

  const [gridSize, setGridSize] = useState<GridSize | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  const speakWord = speakWordUtil

  const totalPairs = gridSize ? GRID_CONFIG[gridSize].pairs : 0

  const startGame = useCallback((size: GridSize) => {
    setGridSize(size)
    setCards(createBoard(GRID_CONFIG[size].pairs))
    setFlippedCards([])
    setMatches(0)
    setMoves(0)
    setGameWon(false)
    setFeedback(null)
    setLocked(false)
  }, [])

  useEffect(() => {
    if (matches > 0 && matches === totalPairs) {
      setGameWon(true)
    }
  }, [matches, totalPairs])

  const handleCardClick = (index: number) => {
    if (locked) return
    if (cards[index].isFlipped || cards[index].isMatched) return
    if (flippedCards.length >= 2) return

    const newCards = [...cards]
    newCards[index].isFlipped = true
    setCards(newCards)
    speakWord(newCards[index].name)

    const newFlipped = [...flippedCards, index]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1)
      setLocked(true)

      const [first, second] = newFlipped
      if (cards[first].name === cards[second].name) {
        setTimeout(() => {
          const matched = [...cards]
          matched[first].isMatched = true
          matched[second].isMatched = true
          setCards(matched)
          setMatches((m) => m + 1)
          setFlippedCards([])
          setLocked(false)
          setFeedback(randomCheer())
          setTimeout(() => setFeedback(null), 1000)
        }, 500)
      } else {
        setTimeout(() => {
          const reset = [...cards]
          reset[first].isFlipped = false
          reset[second].isFlipped = false
          setCards(reset)
          setFlippedCards([])
          setLocked(false)
        }, 800)
      }
    }
  }

  // Grid size selection
  if (!gridSize) {
    return (
      <GameLayout>
        <h1 className="text-3xl sm:text-5xl font-bold text-black">Match It! 🃏</h1>
        <p className="text-lg text-zinc-600">How many pairs do you want to find?</p>
        <div className="flex flex-col sm:flex-row gap-4">
          {(Object.keys(GRID_CONFIG) as GridSize[]).map((size, i) => {
            const colors: Array<'green' | 'yellow' | 'red'> = ['green', 'yellow', 'red']
            return (
              <GameButton key={size} onClick={() => startGame(size)} color={colors[i]} size="lg">
                {GRID_CONFIG[size].label}
              </GameButton>
            )
          })}
        </div>
        <GameButton onClick={() => router.push('/games')} color="purple">
          Back to Games 🎮
        </GameButton>
      </GameLayout>
    )
  }

  // Game won
  if (gameWon) {
    return (
      <GameLayout>
        <h1 className="text-3xl sm:text-5xl font-bold text-black">You Won! 🎉</h1>
        <GameCard color="green">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl text-black font-bold mb-2">All {totalPairs} pairs found!</p>
          <p className="text-lg text-zinc-500">in {moves} moves</p>
        </GameCard>
        <div className="flex gap-4">
          <GameButton onClick={() => startGame(gridSize)} color="green" size="lg">
            Play Again 🔄
          </GameButton>
          <GameButton onClick={() => setGridSize(null)} color="yellow" size="lg">
            Change Size 🔢
          </GameButton>
        </div>
        <GameButton onClick={() => router.push('/games')} color="purple">
          Back to Games 🎮
        </GameButton>
      </GameLayout>
    )
  }

  // Active game
  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 gap-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-black mb-1">Match It! 🃏</h1>
        <p className="text-base text-zinc-500">
          Matches: {'⭐'.repeat(matches)} ({matches}/{totalPairs}) — Moves: {moves}
        </p>
      </div>

      {feedback && (
        <p className="text-2xl font-bold text-green-500 animate-bounce">{feedback}</p>
      )}

      <div className={`grid ${GRID_CONFIG[gridSize].cols} gap-2 sm:gap-3 w-full max-w-md`}>
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => {
              if (card.isMatched) {
                speakWord(card.name)
              } else {
                handleCardClick(index)
              }
            }}
            className={`aspect-square rounded-xl border-4 flex flex-col items-center justify-center transition-all duration-300 ${
              card.isMatched
                ? 'border-green-300 bg-green-100 scale-95 cursor-pointer'
                : card.isFlipped
                ? 'border-yellow-300 bg-yellow-50 rotate-0'
                : 'border-purple-300 bg-purple-100 hover:border-purple-500 hover:shadow-md cursor-pointer'
            }`}
            disabled={locked && !card.isMatched}
          >
            {card.isFlipped || card.isMatched ? (
              <>
                <span className="text-3xl sm:text-5xl">{card.emoji}</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-600 mt-1">{card.name}</span>
                {card.isMatched && <span className="text-xs text-zinc-400">🔊</span>}
              </>
            ) : (
              <span className="text-3xl sm:text-5xl">❓</span>
            )}
          </button>
        ))}
      </div>

      <GameButton onClick={() => router.push('/games')} color="purple" className="mt-2">
        Back to Games 🎮
      </GameButton>
    </div>
  )
}
