'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

const CANVAS_MAX_W = 600
const CANVAS_H = 300

export { CANVAS_MAX_W, CANVAS_H }

export interface ArcadeCanvasOpts<S> {
  init: () => S
  update: (state: S, cw: number) => void
  draw: (ctx: CanvasRenderingContext2D, state: S, cw: number) => void
  onInteract?: (state: S) => void
}

export function useArcadeCanvas<S>(opts: ArcadeCanvasOpts<S>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<S | null>(null)
  const animRef = useRef<number>(0)
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_MAX_W)
  const optsRef = useRef(opts)
  optsRef.current = opts

  // Responsive sizing
  useEffect(() => {
    const resize = () => setCanvasWidth(Math.min(window.innerWidth - 32, CANVAS_MAX_W))
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return
    if (!stateRef.current) stateRef.current = optsRef.current.init()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    const loop = () => {
      const s = stateRef.current!
      optsRef.current.update(s, canvas.width)
      optsRef.current.draw(ctx, s, canvas.width)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth])

  // Interact handler
  const handleInteract = useCallback(() => {
    if (stateRef.current && optsRef.current.onInteract) {
      optsRef.current.onInteract(stateRef.current)
    }
  }, [])

  // Space bar handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        handleInteract()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleInteract])

  const resetState = useCallback(() => {
    stateRef.current = optsRef.current.init()
  }, [])

  return { canvasRef, stateRef, canvasWidth, handleInteract, resetState }
}
