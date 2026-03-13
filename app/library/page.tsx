'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CoverImage, CardGrid, PageLayout, PageTitle } from '@/components/ui'

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-black">Loading library...</p>
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

  if (books.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-black">No books in library yet</p>
        {isAdmin && (
          <Link
            href="/upload"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800"
          >
            Upload Your First Book
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
            src="/library.png"
            alt="Library"
            width={200}
            height={100}
          />
        </h1>
        {isAdmin && (
          <Link
            href="/upload?type=book"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800"
          >
            Upload Book
          </Link>
        )}
      </div>

      <CardGrid>
        {books.map((book) => (
          <Card key={book.id}>
            <CoverImage src={book.cover_image_url} alt={book.title} />

            <div className="p-4">
              <h2 className="text-xl font-bold text-black mb-2 line-clamp-2">
                {book.title}
              </h2>
              <p className="text-sm text-zinc-600 mb-2">
                by {book.author}
              </p>
              {book.description && (
                <p className="text-sm text-zinc-500 mb-4 line-clamp-3">
                  {book.description}
                </p>
              )}

              <div className="flex gap-4 text-xs text-zinc-500 mb-4">
                {book.total_pages && <span>{book.total_pages} pages</span>}
                {book.file_size_mb && <span>{book.file_size_mb} MB</span>}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {isUser && (
                  <Link
                    href={`/read/${book.id}`}
                    className="flex-1 text-center px-4 py-2 bg-green-200 text-rose-600 border border-blue-600 rounded-lg text-sm hover:bg-yellow-100"
                  >
                    Read
                  </Link>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteBook(book)}
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
