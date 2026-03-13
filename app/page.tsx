'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardIcon, PageTitle } from '@/components/ui'

interface Profile {
  id: string
  name: string
  role: string
  age: number | null
  avatar_image_url: string | null
}

export default function Home() {
  const router = useRouter()
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-black">Loading...</p>
      </div>
    )
  }

  return (
    <div className="font-sans">
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 py-10 px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl text-black font-semibold">
            Welcome, {selectedProfile?.name}! 👋
          </h1>
            <PageTitle
              src="/home-logo.png"
              alt="Welcome to Santorio's & Amado's Library"
              width={600}
              height={300}
            />
          <p className="text-lg text-black font-semibold">
            Your personal library and games collection!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full">
          <Card href="/library" className="w-80 flex flex-col items-center justify-center gap-4 p-8">
            <CardIcon src="/triceratops.png" alt="Browse Books" />
            <h2 className="text-xl font-semibold text-black text-center">Browse Books</h2>
          </Card>
          {selectedProfile?.role === 'admin' && (
            <Card href="/upload" className="w-80 flex flex-col items-center justify-center gap-4 p-8">
              <CardIcon src="/upload.png" alt="Upload" />
              <h2 className="text-xl font-semibold text-black text-center">Upload a New Book</h2>
            </Card>
          )}
          <Card href="/games" className="w-80 flex flex-col items-center justify-center gap-4 p-8">
            <CardIcon src="/crab.png" alt="Browse Games" size={150} />
            <h2 className="text-xl font-semibold text-black text-center">Browse Games</h2>
          </Card>
          <Card href="/activity-pages" className="w-80 flex flex-col items-center justify-center gap-4 p-8">
            <CardIcon src="/elephant.avif" alt="Activity Pages" />
            <h2 className="text-xl font-semibold text-black text-center">Browse Activity Pages</h2>
          </Card>
        </div>
      </main>
    </div>
  )
}
