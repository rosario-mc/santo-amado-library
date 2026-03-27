'use client'

import React, { useEffect, useState } from 'react'
import { GameButton } from './ui'
import type { PowerUp } from '@/lib/mario'
import { useLanguage } from '@/lib/i18n'

// ---- PowerUp config ----

const POWER_UP_CONFIG: Record<Exclude<PowerUp, 'none'>, { emoji: string; labelKey: string; animation: string; glow: string }> = {
  'mushroom':     { emoji: '🍄', labelKey: 'overlay.powerUp',       animation: 'animate-mushroom-bounce', glow: 'rgba(234,179,8,0.6)' },
  'star':         { emoji: '⭐', labelKey: 'overlay.starPower',     animation: 'animate-star-sparkle',    glow: 'rgba(234,179,8,0.6)' },
  'fire-flower':  { emoji: '🔥', labelKey: 'overlay.fireFlower',    animation: 'animate-fire-pulse',      glow: 'rgba(239,68,68,0.6)' },
  '1-up':         { emoji: '💚', labelKey: 'overlay.extraLife',     animation: 'animate-oneup-float',     glow: 'rgba(34,197,94,0.6)' },
  'rainbow-star': { emoji: '🌈', labelKey: 'overlay.rainbowPower',  animation: 'animate-rainbow-spin',    glow: 'rgba(168,85,247,0.6)' },
}

// ---- PowerUpOverlay ----

export function PowerUpOverlay({
  powerUp,
  onDismiss,
}: {
  powerUp: PowerUp
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (powerUp !== 'none') {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [powerUp, onDismiss])

  if (!visible || powerUp === 'none') return null

  const config = POWER_UP_CONFIG[powerUp]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-center">
        <div className={config.animation}>
          <span className="text-[8rem] sm:text-[10rem] block" style={{ filter: `drop-shadow(0 0 30px ${config.glow})` }}>
            {config.emoji}
          </span>
        </div>
        <p
          className="text-3xl sm:text-4xl font-black text-[#FFD93D] mt-2 animate-bounce-in"
          style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif', textShadow: '0 3px 10px rgba(0,0,0,0.5)' }}
        >
          {t(config.labelKey)}
        </p>
        {powerUp === '1-up' && (
          <p className="text-lg text-green-300 font-bold mt-1 animate-bounce-in">{t('overlay.plusOneLife')}</p>
        )}
      </div>
    </div>
  )
}

// ---- GameOverOverlay ----

export function GameOverOverlay({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-center animate-game-over-shake">
        <p
          className="text-5xl sm:text-7xl font-black text-red-500 mb-2"
          style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif', textShadow: '0 4px 20px rgba(239,68,68,0.5)' }}
        >
          {t('gameOver')}
        </p>
        <p className="text-xl text-white/70 mb-6">{t('dontGiveUp')}</p>
        <GameButton onClick={onRetry} color="green" size="lg">
          {t('tryAgainButton')}
        </GameButton>
      </div>
    </div>
  )
}
