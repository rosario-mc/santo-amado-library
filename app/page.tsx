'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CardIcon, PageTitle, WaveDivider, LoadingSpinner } from '@/components/ui'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

interface Profile {
  id: string
  name: string
  role: string
  age: number | null
  avatar_image_url: string | null
}

// ---- Scroll-triggered reveal with configurable animation ----
function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: options?.threshold ?? 0.05, rootMargin: options?.rootMargin ?? '50px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [options?.threshold, options?.rootMargin])

  return { ref, visible }
}

// ---- Parallax on mouse move ----
function useParallax(intensity = 20) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = ((e.clientX - centerX) / rect.width) * intensity
      const y = ((e.clientY - centerY) / rect.height) * intensity
      el.style.transform = `translate(${x}px, ${y}px)`
    }

    const handleLeave = () => {
      el.style.transform = 'translate(0, 0)'
      el.style.transition = 'transform 0.5s ease-out'
      setTimeout(() => { el.style.transition = '' }, 500)
    }

    window.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [intensity])

  return ref
}

// ---- Sound effect hook ----
function useSoundEffect() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playPop = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }, [])

  const playWhoosh = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }, [])

  return { playPop, playWhoosh }
}

// ---- Scroll-triggered story text ----
function StoryPopup({
  children,
  direction = 'left',
  delay = 0,
}: {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'center'
  delay?: number
}) {
  const { ref, visible } = useScrollReveal({ threshold: 0.2 })
  const animClass = {
    left: 'animate-slide-left',
    right: 'animate-slide-right',
    center: 'animate-pop-in',
  }

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'} ${visible ? animClass[direction] : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

// ---- Section Card with 3D tilt and sound ----
function SectionCard({
  href,
  icon,
  iconSize,
  label,
  description,
  bg,
  borderColor,
  delay,
  onHover,
}: {
  href: string
  icon: string
  iconSize?: number
  label: string
  description: string
  bg: string
  borderColor: string
  delay: number
  onHover?: () => void
}) {
  const { ref, visible } = useScrollReveal()

  return (
    <Link href={href}>
      <div ref={ref as any}>
        <div
          onMouseEnter={onHover}
          className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-4 ${borderColor} card-3d hover-glow cursor-pointer transition-opacity duration-500 ${visible ? 'opacity-100 animate-bounce-in' : 'opacity-0'}`}
          style={{ background: bg, animationDelay: `${delay}s` }}
        >
          <div className="card-3d-shine" />
          <CardIcon src={icon} alt={label} size={iconSize || 140} />
          <h3
            className="text-2xl font-black text-white text-center"
            style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
          >
            {label}
          </h3>
          <p className="text-sm text-white/70 text-center font-medium">{description}</p>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const router = useRouter()
  const { t } = useLanguage()
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const menuReveal = useScrollReveal()
  const heroParallax = useParallax(15)
  const { playPop, playWhoosh } = useSoundEffect()

  // Scroll progress for background intensity
  const [scrollProgress, setScrollProgress] = useState(0)
  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const profileData = sessionStorage.getItem('selectedProfile')
    if (!profileData) {
      router.push('/profiles')
    } else {
      setSelectedProfile(JSON.parse(profileData))
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return <LoadingSpinner text={t('loading')} />
  }

  return (
    <div>
      {/* ---- HERO SECTION with parallax ---- */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #145A32 0%, #1A4D6E 50%, #2D1B69 100%)' }}>
        <div
          ref={heroParallax}
          className="w-full max-w-6xl mx-auto flex flex-col items-center gap-3 py-6 px-4 sm:px-6 animate-slide-up"
        >
          <PageTitle
            src="/home-logo.png"
            alt="Welcome to Santorio's & Amado's Library"
            width={400}
            height={200}
          />

          <StoryPopup direction="center" delay={0.3}>
            <p
              className="text-lg sm:text-xl font-bold text-[#D4A76A] text-center"
              style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
            >
              {selectedProfile?.name
                ? t('home.welcomeBack').replace('{name}', selectedProfile.name)
                : t('home.subtitle')}
            </p>
          </StoryPopup>

          {/* Scroll indicator */}
          <div className="mt-4 animate-float">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#4ECDC4]/60">
              <path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ---- Wave transition ---- */}
      <WaveDivider from="#2D1B69" to="#1A3A5C" />

      {/* ---- SCROLL STORYTELLING: Popup greeting ---- */}
      <section
        className="pt-6 pb-2 px-4"
        style={{ background: '#1A3A5C', opacity: 0.85 + scrollProgress * 0.15 }}
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
          <StoryPopup direction="left" delay={0}>
            <p
              className="text-xl sm:text-2xl font-black text-[#4ECDC4] text-center"
              style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
            >
              {t('home.readyAdventure').replace('{name}', selectedProfile?.name || 'adventurer')}
            </p>
          </StoryPopup>
        </div>
      </section>

      {/* ---- GREEN MENU SECTION ---- */}
      <section className="py-6 px-4" style={{ background: '#1A3A5C' }}>
        <div ref={menuReveal.ref} className="max-w-6xl mx-auto">
          <h2
            className={`hero-text text-3xl sm:text-5xl text-center text-[#4ECDC4] mb-8 transition-opacity duration-500 ${menuReveal.visible ? 'opacity-100 animate-slide-up' : 'opacity-0'}`}
          >
            {t('home.whatToDo')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <SectionCard
              href="/library"
              icon="/triceratops.png"
              label={t('home.browseBooks')}
              description={t('home.browseBooksDesc')}
              bg="#0B3D1C"
              borderColor="border-[#22C55E]"
              delay={0.1}
              onHover={playPop}
            />
            <SectionCard
              href="/games"
              icon="/crab.png"
              iconSize={150}
              label={t('home.playGames')}
              description={t('home.playGamesDesc')}
              bg="#0C4A6E"
              borderColor="border-[#38BDF8]"
              delay={0.2}
              onHover={playPop}
            />
            <SectionCard
              href="/activity-pages"
              icon="/elephant.avif"
              label={t('home.activityPages')}
              description={t('home.activityPagesDesc')}
              bg="#5C3D1E"
              borderColor="border-[#D4A76A]"
              delay={0.3}
              onHover={playPop}
            />
            {selectedProfile?.role === 'admin' && (
              <SectionCard
                href="/upload"
                icon="/upload.png"
                label={t('home.upload')}
                description={t('home.uploadDesc')}
                bg="#0A2F15"
                borderColor="border-[#4ECDC4]"
                delay={0.4}
                onHover={playPop}
              />
            )}
          </div>
        </div>
      </section>

      {/* ---- Wave to bottom ---- */}
      <WaveDivider from="#1A3A5C" to="#2D1B69" />

      {/* ---- Bottom Story Section ---- */}
      <section className="py-8 px-4" style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #1A4D6E 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <StoryPopup direction="center" delay={0.1}>
            <p
              className="text-2xl sm:text-3xl font-black text-shimmer mb-2"
              style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
            >
              {t('home.pageTurn')}
            </p>
          </StoryPopup>
          <StoryPopup direction="center" delay={0.3}>
            <p className="text-base text-white/50 font-medium">
              {t('home.madeWithLove')}
            </p>
          </StoryPopup>
        </div>
      </section>
    </div>
  )
}
