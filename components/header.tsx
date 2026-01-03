'use client'

import { useEffect, useState } from 'react'
import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation'

interface Profile {
    id: string
    name: string
    role: string
    age: number | null
    avatar_image_url: string | null
}

export default function Header() {
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
    const pathname = usePathname()
    const isProfilePage = pathname === '/profiles'


    useEffect(() => {
        const profileData = sessionStorage.getItem('selectedProfile')
        if (profileData) {
            setSelectedProfile(JSON.parse(profileData))
        }
    }, [])

    return (
        <header className="border-b border-black">
            <nav className="flex items-center justify-between h-16 px-4">
                <Link href="/" className="transition-transform hover:scale-105">
                    <Image
                        src="/header-logo.png"
                        alt="LibroLandia"
                        width={200}
                        height={50}
                        priority
                        className="hover:scale-105 hover:drop-shadow-lg transition-all duration-300"
                    />
                </Link>

                {/* User Profile Display */}
                {selectedProfile && !isProfilePage && (
                    <Link
                        href="/profiles"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-black/5 rounded-lg transition-all"
                    >
                        {selectedProfile.avatar_image_url ? (
                            <img
                                src={selectedProfile.avatar_image_url}
                                alt={selectedProfile.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-black"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center border-2 border-black">
                                <span className="text-xl">👤</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-black">{selectedProfile.name}</span>
                            <span className="text-xs text-zinc-600">Switch Profile</span>
                        </div>
                    </Link>
                )}
            </nav>
        </header>
    );
}
