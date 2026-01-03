'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from "next/image";
import Link from "next/link";

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
          <Image
            src="/home-logo.png"
            alt="Welcome to Santorio's & Amado's Library"
            width={600}
            height={300}
            priority
          />
          <p className="text-lg text-black font-semibold">
            Your personal library and games collection!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full">
          <Link
            className="w-80 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all hover:shadow-lg backdrop-blur-md bg-white/10"
            href="/library"
          >
            <span className="text-5xl">
              <Image
                src="/triceratops.png"
                alt="📚"
                width={200}
                height={200}
                priority
              />
            </span>
            <h2 className="text-xl font-semibold text-black text-center">
              Browse Books
            </h2>
          </Link>
          {selectedProfile?.role === 'admin' && (
            <Link
              className="w-80 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all hover:shadow-lg backdrop-blur-md bg-white/10"
              href="/upload"
            >
              <span className="text-5xl">
                <Image
                  src="/upload.png"
                  alt="Browse Books"
                  width={200}
                  height={200}
                  priority
                />
              </span>
              <h2 className="text-xl font-semibold text-black text-center">
                Upload a New Book
              </h2>
            </Link>
          )}
          <Link
            className="w-80 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all hover:shadow-lg backdrop-blur-md bg-white/10"
            href="/games"
          >
            <span className="text-5xl">
              <Image
                src="/crab.png"
                alt="🎮"
                width={150}
                height={70}
                priority
              />
            </span>
            <h2 className="text-xl font-semibold text-black text-center">
              Browse Games
            </h2>
          </Link>
          <Link
            className="w-80 flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all hover:shadow-lg backdrop-blur-md bg-white/10"
            href="/activity-pages"
          >
            <span className="text-5xl">
              <Image
                src="/elephant.avif"
                alt="📚"
                width={200}
                height={200}
                priority
              />
            </span>
            <h2 className="text-xl font-semibold text-black text-center">
              Browse Activity Pages
            </h2>
          </Link>
        </div>
      </main>
    </div>
  );
}

