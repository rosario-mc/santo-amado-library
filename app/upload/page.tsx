'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadPage()  {
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [description, setDescription] = useState('')
    const [totalPages, setTotalPages] = useState<number | ''>('')
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!pdfFile) {
            setMessage('Please select a PDF file')
            return
        }

        setUploading(true)
        setMessage('')

        try {
            const fileSizeMB = (pdfFile.size / (1024 * 1024)).toFixed(2)

            const sanitizedPdfName = pdfFile.name.replace(/\s+/g, '_')
            const pdfPath = `${Date.now()}-${sanitizedPdfName}`

            const { error: pdfError } = await supabase.storage
                .from('books')
                .upload(pdfPath, pdfFile)
            
            if (pdfError) throw pdfError

            const { data: pdfData } = supabase.storage
                .from('books')
                .getPublicUrl(pdfPath)

            let coverUrl = null
            if (coverFile) {
                const sanitizedName = coverFile.name.replace(/\s+/g, '_')
                const coverPath = `${Date.now()}-${sanitizedName}`
                const { error: coverError } = await supabase.storage
                    .from('books')
                    .upload(coverPath, coverFile)

                if (coverError) {
                } else {
                    const { data: coverData } = supabase.storage
                        .from('books')
                        .getPublicUrl(coverPath)
                    coverUrl = coverData.publicUrl
                }
            }

            const { error: dbError } = await supabase
                .from('books')
                .insert({
                    title,
                    author,
                    description: description || null,
                    pdf_url: pdfData.publicUrl,
                    cover_image_url: coverUrl,
                    total_pages: totalPages || null,
                    file_size_mb: parseFloat(fileSizeMB),
                })

            if (dbError) throw dbError

            setMessage('Book upload successful.')
            setTitle('')
            setAuthor('')
            setDescription('')
            setTotalPages('')
            setPdfFile(null)
            setCoverFile(null)

            if (pdfInputRef.current) pdfInputRef.current.value = ''
            if (coverInputRef.current) coverInputRef.current.value = ''

        } catch (error: any) {
            setMessage(`Error: ${error.message}`)
        } finally {
            setUploading(false)
        }
    }

return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
          Upload New Book
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              Author *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
          </div>

          {/* Total Pages - NEW */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              Total Pages
            </label>
            <input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
              className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
          </div>

          {/* PDF File */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              PDF File *
            </label>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              required
              className="w-full text-black dark:text-white"
            />
            {pdfFile && (
              <p className="text-sm text-zinc-500 mt-1">
                File size: {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              Cover Image (optional)
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full text-black dark:text-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Book'}
          </button>

          {/* Message */}
          {message && (
            <p className={`text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}