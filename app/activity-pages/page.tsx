'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CoverImage, CardGrid, PageLayout, PageTitle } from '@/components/ui'

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
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-black">Loading Activity Pages...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-red-500">Error: {error}</p>
            </div>
        )
    }

    if (activityPages.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-black">No activity pages in library yet</p>
                {isAdmin && (
                    <Link
                        href="/upload"
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800"
                    >
                        Upload Your First Activity Page
                    </Link>
                )}
            </div>
        )
    }

    return (
        <PageLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-black">
                    <PageTitle
                        src="/activity-page.png"
                        alt="Activity Pages"
                        width={350}
                        height={200}
                    />
                </h1>
                {isAdmin && (
                    <Link
                        href="/upload?type=activity"
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800"
                    >
                        Upload Activity Pages
                    </Link>
                )}
            </div>

            <CardGrid>
                {activityPages.map((activityPage) => (
                    <Card key={activityPage.id}>
                        <CoverImage src={activityPage.cover_image_url} alt={activityPage.title} />

                        <div className="p-4">
                            <h2 className="text-xl font-bold text-black mb-2 line-clamp-2">
                                {activityPage.title}
                            </h2>

                            <div className="flex gap-4 text-xs text-zinc-500 mb-4">
                                {activityPage.file_size_mb && <span>{activityPage.file_size_mb} MB</span>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <a
                                        href={activityPage.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 text-center px-4 py-2 bg-green-200 text-rose-600 border border-blue-600 rounded-lg text-sm hover:bg-yellow-100"
                                    >
                                        Print
                                    </a>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => deleteActivityPage(activityPage)}
                                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
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
