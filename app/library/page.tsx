'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CoverImage, CardGrid, PageLayout, PageTitle, GameButton, LoadingSpinner, SkeletonGrid } from '@/components/ui'

interface Book {
  id: string
  title: string
  author: string
  description: string | null
  cover_image_url: string | null
  pdf_url: string
  total_pages: number | null
  file_size_mb: number | null
  created_at: string
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const isAdmin = selectedProfile?.role === 'admin'
  const isUser = selectedProfile?.role === 'user'

  useEffect(() => {
    const profileData = sessionStorage.getItem('selectedProfile')
    if (profileData) {
      setSelectedProfile(JSON.parse(profileData))
    }
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true })

      if (error) throw error

      setBooks(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteBook = async (book: Book) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return
    }

    try {
      const pdfFileName = book.pdf_url.split('/').pop()
      if (pdfFileName) {
        await supabase.storage.from('books').remove([pdfFileName])
      }

      if (book.cover_image_url) {
        const coverFileName = book.cover_image_url.split('/').pop()
        if (coverFileName) {
          await supabase.storage.from('books').remove([coverFileName])
        }
      }

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id)

      if (error) throw error

      fetchBooks()
    } catch (error: any) {
      alert(`Error deleting book: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-between items-center mb-10 animate-slide-up">
          <div className="flex items-center gap-4">
            <PageTitle src="/library.png" alt="Library" width={200} height={100} />
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

  if (books.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="text-6xl animate-float">📚</span>
        <p className="text-xl font-bold text-white/70">No books in library yet</p>
        {isAdmin && (
          <Link href="/upload">
            <GameButton color="green" size="lg">Upload Your First Book</GameButton>
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
            src="/library.png"
            alt="Library"
            width={200}
            height={100}
          />
        </div>
        {isAdmin && (
          <Link href="/upload?type=book">
            <GameButton color="green" size="md">Upload Book</GameButton>
          </Link>
        )}
      </div>

      <CardGrid>
        {books.map((book, i) => (
          <Card key={book.id} href={isUser ? `/read/${book.id}` : undefined} className={`animate-bounce-in stagger-${Math.min(i + 1, 6)}`}>
            <CoverImage src={book.cover_image_url} alt={book.title} />

            <div className="p-4">
              <h2
                className="text-lg font-black mb-2 line-clamp-2 text-white"
                style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
              >
                {book.title}
              </h2>
              <p className="text-sm font-medium mb-2 text-[#D4A76A]">
                by {book.author}
              </p>
              {book.description && (
                <p className="text-sm text-white/40 mb-4 line-clamp-3">
                  {book.description}
                </p>
              )}

              <div className="flex gap-4 text-xs text-white/30 mb-4 font-medium">
                {book.total_pages && <span>{book.total_pages} pages</span>}
                {book.file_size_mb && <span>{book.file_size_mb} MB</span>}
              </div>

              {isAdmin && (
                <button
                  onClick={(e) => { e.preventDefault(); deleteBook(book) }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold shadow-[0_4px_0_#991b1b] hover:shadow-[0_2px_0_#991b1b] hover:translate-y-[2px] transition-all"
                >
                  Delete
                </button>
              )}
            </div>
          </Card>
        ))}
      </CardGrid>
    </PageLayout>
  )
}
