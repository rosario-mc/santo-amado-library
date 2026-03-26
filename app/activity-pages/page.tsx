'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CoverImage, CardGrid, PageLayout, PageTitle, GameButton, SkeletonGrid } from '@/components/ui'

interface ActivityPage {
    id: string
    title: string
    cover_image_url: string | null
    pdf_url: string
    file_size_mb: number | null
    created_at: string
}

export default function ActivityPagesPage() {
    const [activityPages, setActivityPages] = useState<ActivityPage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedProfile, setSelectedProfile] = useState<any>(null)
    const isAdmin = selectedProfile?.role === 'admin'

    useEffect(() => {
        const profileData = sessionStorage.getItem('selectedProfile')
        if (profileData) {
            setSelectedProfile(JSON.parse(profileData))
        }
        fetchActivityPages()
    }, [])

    const fetchActivityPages = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_pages')
                .select('*')
                .order('title', { ascending: true })

            if (error) throw error

            setActivityPages(data || [])
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteActivityPage = async (activityPage: ActivityPage) => {
        if (!confirm(`Are you sure you want to delete "${activityPage.title}"?`)) {
            return
        }

        try {
            const pdfFileName = activityPage.pdf_url.split('/').pop()
            if (pdfFileName) {
                await supabase.storage.from('activity_pages').remove([pdfFileName])
            }

            if (activityPage.cover_image_url) {
                const coverFileName = activityPage.cover_image_url.split('/').pop()
                if (coverFileName) {
                    await supabase.storage.from('activity_pages').remove([coverFileName])
                }
            }

            const { error } = await supabase
                .from('activity_pages')
                .delete()
                .eq('id', activityPage.id)

            if (error) throw error

            fetchActivityPages()
        } catch (error: any) {
            alert(`Error deleting activity page: ${error.message}`)
        }
    }

    if (loading) {
        return (
            <PageLayout>
                <div className="flex justify-between items-center mb-10 animate-slide-up">
                    <div className="flex items-center gap-4">
                        <PageTitle src="/activity-page.png" alt="Activity Pages" width={350} height={200} />
                    </div>
                </div>
                <SkeletonGrid count={8} />
            </PageLayout>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-red-500 font-bold">Error: {error}</p>
            </div>
        )
    }

    if (activityPages.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <span className="text-6xl animate-float">🎨</span>
                <p className="text-xl font-bold text-white/70">No activity pages in library yet</p>
                {isAdmin && (
                    <Link href="/upload">
                        <GameButton color="green" size="lg">Upload Your First Activity Page</GameButton>
                    </Link>
                )}
            </div>
        )
    }

    return (
        <PageLayout>
            <div className="flex justify-between items-center mb-10 animate-slide-up">
                <div className="flex items-center gap-4">
                    <PageTitle
                        src="/activity-page.png"
                        alt="Activity Pages"
                        width={350}
                        height={200}
                    />
                </div>
                {isAdmin && (
                    <Link href="/upload?type=activity">
                        <GameButton color="green" size="md">Upload Activity Pages</GameButton>
                    </Link>
                )}
            </div>

            <CardGrid>
                {activityPages.map((activityPage, i) => (
                    <Card key={activityPage.id} className={`animate-bounce-in stagger-${Math.min(i + 1, 6)}`}>
                        <CoverImage src={activityPage.cover_image_url} alt={activityPage.title} />

                        <div className="p-4">
                            <h2
                                className="text-lg font-black mb-2 line-clamp-2 text-white"
                                style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
                            >
                                {activityPage.title}
                            </h2>

                            <div className="flex gap-4 text-xs text-white/30 mb-4 font-medium">
                                {activityPage.file_size_mb && <span>{activityPage.file_size_mb} MB</span>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <a
                                    href={activityPage.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-center px-4 py-2.5 bg-[#22C55E] text-[#0B3D1C] rounded-full text-sm font-black shadow-[0_4px_0_#166534] hover:shadow-[0_2px_0_#166534] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
                                    style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
                                >
                                    🖨️ PRINT
                                </a>
                                {isAdmin && (
                                    <button
                                        onClick={() => deleteActivityPage(activityPage)}
                                        className="w-full px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold shadow-[0_4px_0_#991b1b] hover:shadow-[0_2px_0_#991b1b] hover:translate-y-[2px] transition-all"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </CardGrid>
        </PageLayout>
    )
}
