'use client'

import { PageTitle } from '@/components/ui'
import Link from 'next/link'

const games = [
  {
    id: 'addition',
    title: 'Adding Fun',
    description: 'Practice adding numbers together with counting dots to help!',
    emoji: '➕',
    color: 'border-green-300 hover:border-green-500',
    bg: 'bg-green-50',
  },
  {
    id: 'typing',
    title: 'Type It!',
    description: 'Listen to a word and type it! Practice your letters and spelling.',
    emoji: '⌨️',
    color: 'border-blue-300 hover:border-blue-500',
    bg: 'bg-blue-50',
  },
  {
    id: 'matching',
    title: 'Match It!',
    description: 'Flip the cards and find the matching pairs! Train your memory.',
    emoji: '🃏',
    color: 'border-purple-300 hover:border-purple-500',
    bg: 'bg-purple-50',
  },
  {
    id: 'writing',
    title: 'Write It!',
    description: 'Trace and practice writing your letters with your finger!',
    emoji: '✏️',
    color: 'border-indigo-300 hover:border-indigo-500',
    bg: 'bg-indigo-50',
  },
]

export default function GamesPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <PageTitle
            src="/games.png"
            alt="Games"
            width={200}
            height={100}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 ${game.color} transition-all hover:shadow-lg backdrop-blur-md bg-white/10`}
            >
              <span className="text-6xl">{game.emoji}</span>
              <h2 className="text-xl font-bold text-black">{game.title}</h2>
              <p className="text-sm text-zinc-600 text-center">{game.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
