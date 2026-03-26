'use client'

import { useEffect, useRef } from 'react'

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const rippleContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    let mouseX = 0
    let mouseY = 0
    let currentX = 0
    let currentY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    // Smooth follow with lerp
    let animId: number
    const animate = () => {
      currentX += (mouseX - currentX) * 0.15
      currentY += (mouseY - currentY) * 0.15
      glow.style.transform = `translate(${currentX - 150}px, ${currentY - 150}px)`
      animId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    animId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  // Click ripple effect
  useEffect(() => {
    const container = rippleContainerRef.current
    if (!container) return

    const handleClick = (e: MouseEvent) => {
      const ripple = document.createElement('div')
      ripple.className = 'click-ripple'
      ripple.style.left = `${e.clientX}px`
      ripple.style.top = `${e.clientY}px`
      container.appendChild(ripple)
      setTimeout(() => ripple.remove(), 700)
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return (
    <>
      {/* Mouse-following glow */}
      <div
        ref={glowRef}
        className="mouse-glow"
        aria-hidden="true"
      />
      {/* Click ripple container */}
      <div
        ref={rippleContainerRef}
        className="click-ripple-container"
        aria-hidden="true"
      />
    </>
  )
}
