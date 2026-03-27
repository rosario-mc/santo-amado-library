'use client'

import { useState, useCallback, useRef } from 'react'
import { randomCheer } from './games'

// ---- MarioSounds: Web Audio API synthesized retro sounds ----

class MarioSounds {
  private ctx: AudioContext | null = null

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    return this.ctx
  }

  private playTone(freq: number, start: number, duration: number, type: OscillatorType = 'square') {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.15, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration)
  }

  coin() {
    try {
      const ctx = this.getCtx()
      const now = ctx.currentTime
      this.playTone(988, now, 0.08) // B5
      this.playTone(1319, now + 0.08, 0.15) // E6
    } catch { /* audio not available */ }
  }

  powerUp() {
    try {
      const ctx = this.getCtx()
      const now = ctx.currentTime
      const notes = [523, 659, 784, 1047, 1319] // C5 E5 G5 C6 E6
      notes.forEach((freq, i) => {
        this.playTone(freq, now + i * 0.08, 0.1)
      })
    } catch { /* audio not available */ }
  }

  oneUp() {
    try {
      const ctx = this.getCtx()
      const now = ctx.currentTime
      this.playTone(659, now, 0.1) // E5
      this.playTone(880, now + 0.1, 0.1) // A5
      this.playTone(1175, now + 0.2, 0.15) // D6
    } catch { /* audio not available */ }
  }

  gameOver() {
    try {
      const ctx = this.getCtx()
      const now = ctx.currentTime
      const notes = [494, 466, 440, 415, 392, 349, 330] // B4 Bb4 A4 Ab4 G4 F4 E4
      notes.forEach((freq, i) => {
        this.playTone(freq, now + i * 0.15, 0.2, 'triangle')
      })
    } catch { /* audio not available */ }
  }

  bump() {
    try {
      const ctx = this.getCtx()
      const now = ctx.currentTime
      this.playTone(150, now, 0.1, 'triangle')
    } catch { /* audio not available */ }
  }
}

const sounds = new MarioSounds()

// ---- useMarioGame hook ----

export type PowerUp = 'none' | 'mushroom' | 'star' | 'fire-flower' | '1-up' | 'rainbow-star'

interface MarioGameState {
  coins: number
  lives: number
  streak: number
  isGameOver: boolean
  world: string
  powerUp: PowerUp
}

export function useMarioGame() {
  const [state, setState] = useState<MarioGameState>({
    coins: 0,
    lives: 3,
    streak: 0,
    isGameOver: false,
    world: 'World 1-1',
    powerUp: 'none',
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const onCorrect = useCallback((lang: 'en' | 'es' = 'en'): string => {
    sounds.coin()
    const cheer = randomCheer(lang)
    setState(prev => {
      const newCoins = prev.coins + 1
      const newStreak = prev.streak + 1
      const worldLevel = Math.floor(newCoins / 10) + 1
      const worldStage = (newCoins % 10) + 1
      const world = `World ${worldLevel}-${Math.min(worldStage, 4)}`

      let powerUp: PowerUp = prev.powerUp
      let lives = prev.lives
      if (newStreak === 15) {
        powerUp = 'rainbow-star'
        sounds.powerUp()
      } else if (newStreak === 10) {
        powerUp = '1-up'
        lives = prev.lives + 1
        sounds.oneUp()
      } else if (newStreak === 7) {
        powerUp = 'fire-flower'
        sounds.powerUp()
      } else if (newStreak === 5) {
        powerUp = 'star'
        sounds.powerUp()
      } else if (newStreak === 3) {
        powerUp = 'mushroom'
        sounds.oneUp()
      }

      return { ...prev, coins: newCoins, streak: newStreak, world, powerUp, lives }
    })
    return cheer
  }, [])

  const onWrong = useCallback(() => {
    sounds.bump()
    setState(prev => {
      const newLives = prev.lives - 1
      return {
        ...prev,
        lives: newLives,
        streak: 0,
        powerUp: 'none',
        isGameOver: newLives <= 0,
      }
    })
  }, [])

  const resetGame = useCallback(() => {
    setState({
      coins: 0,
      lives: 3,
      streak: 0,
      isGameOver: false,
      world: 'World 1-1',
      powerUp: 'none',
    })
  }, [])

  const dismissPowerUp = useCallback(() => {
    setState(prev => ({ ...prev, powerUp: 'none' }))
  }, [])

  return {
    coins: state.coins,
    lives: state.lives,
    streak: state.streak,
    isGameOver: state.isGameOver,
    world: state.world,
    powerUp: state.powerUp,
    onCorrect,
    onWrong,
    resetGame,
    dismissPowerUp,
  }
}
