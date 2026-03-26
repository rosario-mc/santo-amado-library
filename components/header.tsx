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

const marqueeText = "BOOKS \u2022 GAMES \u2022 ADVENTURE \u2022 LEARN \u2022 PLAY \u2022 EXPLORE \u2022 READ \u2022 FUN \u2022 "

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
        <header className="relative z-20">
            {/* Main nav bar */}
            <nav className="flex items-center justify-between h-14 sm:h-18 px-3 sm:px-6 bg-gradient-to-r from-[#145A32] via-[#1A4D6E] to-[#2D1B69] border-b-4 border-[#4ECDC4]/60">
                <Link href="/" className="transition-transform hover:scale-110 hover:rotate-[-2deg] duration-300 hover-bounce shrink-0">
                    <Image
                        src="/header-logo.png"
                        alt="LibroLandia"
                        width={200}
                        height={50}
                        priority
                        className="w-[120px] sm:w-[200px] h-auto drop-shadow-[0_2px_8px_rgba(78,205,196,0.4)] hover:drop-shadow-[0_4px_16px_rgba(78,205,196,0.6)] transition-all duration-300"
                    />
                </Link>

                {selectedProfile && !isProfilePage && (
                    <Link
                        href="/profiles"
                        className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 border-2 border-[#4ECDC4]/50 rounded-full transition-all duration-300 hover:scale-105"
                    >
                        {selectedProfile.avatar_image_url ? (
                            <img
                                src={selectedProfile.avatar_image_url}
                                alt={selectedProfile.name}
                                className="w-7 h-7 sm:w-10 sm:h-10 rounded-full object-cover border-2 sm:border-3 border-[#22C55E] shadow-md"
                            />
                        ) : (
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#22C55E] flex items-center justify-center border-2 sm:border-3 border-[#16A34A] shadow-md">
                                <span className="text-sm sm:text-xl">👤</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-white drop-shadow-sm">{selectedProfile.name}</span>
                            <span className="text-[10px] sm:text-xs text-[#22C55E]/80 hidden sm:block">Switch Profile</span>
                        </div>
                    </Link>
                )}
            </nav>

            {/* Scrolling marquee ticker */}
            <div className="bg-gradient-to-r from-[#22C55E] via-[#4ECDC4] to-[#A855F7] overflow-hidden border-b-2 border-white/20">
                <div className="marquee-track py-1.5">
                    {[...Array(4)].map((_, i) => (
                        <span
                            key={i}
                            className="text-sm font-black text-white/90 tracking-widest whitespace-nowrap px-2 drop-shadow-sm"
                            style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
                        >
                            {marqueeText}
                        </span>
                    ))}
                </div>
            </div>
        </header>
    );
}
