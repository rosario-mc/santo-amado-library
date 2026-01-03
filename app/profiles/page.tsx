'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface Profile {
    id: string
    name: string
    role: string
    age: number
    avatar_image_url: string | null
    created_at: string
}

export default function ProfilePage() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)

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
        sessionStorage.setItem('selectedProfile', JSON.stringify(profile))
        window.location.href = '/'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-black">
                    Loading Profiles...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-red-500">
                    Error: {error}
                </p>
            </div>
        )
    }

    if (profiles.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-black">
                    No Profiles in library yet
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 pt-12 pb-4 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col justify-center items-center mb-8 gap-4">
                    <Image
                        src="/welcome.png"
                        alt="Welcome to"
                        width={300}
                        height={100}
                        priority
                    />
                    <Image
                        src="/home-logo.png"
                        alt="Welcome to Santorio's & Amado's Library"
                        width={600}
                        height={300}
                        priority
                    />
                    <Image
                        src="/select-profile.png"
                        alt="Profiles"
                        width={400}
                        height={300}
                        priority
                    />
                </div>
                <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => handleSelectProfile(profile)}
                            className="backdrop-blur-md bg-white/10 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer w-80"
                        >
                            <div className="p-4">
                                <h2 className="text-xl font-bold text-blue-700 mb-2 text-center">
                                    {profile.name}
                                </h2>
                            </div>
                            {/* Avatar Image */}
                            <div className="relative h-64">
                                {profile.avatar_image_url ? (
                                    <img
                                        src={profile.avatar_image_url}
                                        alt={profile.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="text-6xl">📚</span>
                                    </div>
                                )}
                            </div>

                            {/* Profile Info */}
                            {profile.age && (
                                <div className="p-4">
                                    <p className="text-sm text-zinc-600 text-center">
                                        Age: {profile.age}
                                    </p>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}