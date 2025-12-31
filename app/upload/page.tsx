'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Image from "next/image";

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
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto backdrop-blur-md bg-white/10 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-black">
          <Image
          src="/upload-new-book.png"
          alt="Upload New Book"
          width={320}
          height={150}
          priority
          />
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg text-black"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Author *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg text-black"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg text-black"
            />
          </div>

          {/* Total Pages - NEW */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Total Pages
            </label>
            <input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
              className="w-full px-4 py-2 border rounded-lg text-black"
            />
          </div>

          {/* PDF File */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              PDF File *
            </label>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              required
              className="w-full text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-black file:bg-white file:text-black file:font-medium hover:file:bg-zinc-300 file:cursor-pointer"
            />
            {pdfFile && (
              <p className="text-sm text-zinc-500 mt-1">
                File size: {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Cover Image (optional)
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-black file:bg-white file:text-black file:font-medium hover:file:bg-zinc-300 file:cursor-pointer"
            />

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50"
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