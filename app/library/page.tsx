'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

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

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

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
        <Link
          href="/upload"
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800"
        >
          Upload Your First Book
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black">
            <Image
            src="/library.png"
            alt="Library"
            width={200}
            height={100}
            priority
            />
          </h1>
          <Link
            href="/upload"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800"
          >
            Upload Book
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="backdrop-blur-md bg-white/10 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Cover Image */}
              <div className="relative h-64">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-6xl">📚</span>
                  </div>
                )}
              </div>

              {/* Book Info */}
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

                {/* Metadata */}
                <div className="flex gap-4 text-xs text-zinc-500 mb-4">
                  {book.total_pages && <span>{book.total_pages} pages</span>}
                  {book.file_size_mb && <span>{book.file_size_mb} MB</span>}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <a
                          href={book.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-4 py-2 bg-white text-black border border-black rounded-lg text-sm hover:bg-zinc-300"
                        >
                          Read
                        </a>
                        <a
                          href={book.pdf_url}
                          download
                          className="flex-1 text-center px-4 py-2 bg-white text-black border border-black rounded-lg text-sm hover:bg-zinc-300"
                        >
                          Download
                        </a>
                    </div>
                    <button
                      onClick={() => deleteBook(book)}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
