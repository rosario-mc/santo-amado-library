'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CoverImage, PageTitle, LoadingSpinner } from '@/components/ui'

interface Profile {
    id: string
    name: string
    role: string
    age: number
    avatar_image_url: string | null
    created_at: string
}

const profileColors = [
  'border-[#22C55E]',
  'border-[#38BDF8]',
  'border-[#D4A76A]',
  'border-[#4ECDC4]',
  'border-[#FFD93D]',
]

function useSoundEffect() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playSelect = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.16)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [])

  return { playSelect }
}

export default function ProfilePage() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
    const [clickedId, setClickedId] = useState<string | null>(null)
    const { playSelect } = useSoundEffect()

    useEffect(() => {
        fetchProfiles()
    }, [])

    useEffect(() => {
        sessionStorage.removeItem('selectedProfile')
    }, [])

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setProfiles(data || [])
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectProfile = (profile: Profile) => {
        playSelect()
        setClickedId(profile.id)
        setTimeout(() => {
            sessionStorage.setItem('selectedProfile', JSON.stringify(profile))
            window.location.href = '/'
        }, 400)
    }

    if (loading) {
        return <LoadingSpinner text="Loading Profiles..." />
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-red-500 font-bold">Error: {error}</p>
            </div>
        )
    }

    if (profiles.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl font-bold text-white/70">No Profiles in library yet</p>
            </div>
        )
    }

    return (
        <div className="flex-1 pt-12 pb-4 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col justify-center items-center mb-12 gap-4 animate-slide-up">
                    <PageTitle
                        src="/welcome.png"
                        alt="Welcome to"
                        width={300}
                        height={100}
                    />
                    <PageTitle
                        src="/home-logo.png"
                        alt="Welcome to Santorio's & Amado's Library"
                        width={600}
                        height={300}
                    />
                    <h2
                        className="hero-text text-4xl sm:text-6xl text-shimmer mt-4"
                    >
                        WHO&apos;S PLAYING? 🎮
                    </h2>
                </div>
                <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
                    {profiles.map((profile, i) => (
                        <div
                            key={profile.id}
                            className={`transition-all duration-300 ${clickedId === profile.id ? 'scale-110 rotate-[2deg]' : ''} ${clickedId && clickedId !== profile.id ? 'opacity-30 scale-95' : ''}`}
                        >
                            <Card
                                onClick={() => handleSelectProfile(profile)}
                                className={`w-80 animate-bounce-in stagger-${i + 1} border-4 ${profileColors[i % profileColors.length]} hover-glow`}
                            >
                                <div className="p-4">
                                    <h2
                                        className="text-2xl font-black mb-2 text-center text-white"
                                        style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
                                    >
                                        {profile.name}
                                    </h2>
                                </div>
                                <CoverImage src={profile.avatar_image_url} alt={profile.name} />
                                {profile.age && (
                                    <div className="p-4">
                                        <p className="text-sm font-semibold text-center text-[#D4A76A]">
                                            Age: {profile.age}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
