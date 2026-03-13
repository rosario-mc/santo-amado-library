'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HTMLFlipBook from 'react-pageflip'
import * as pdfjsLib from 'pdfjs-dist'
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface Book {
  id: string
  title: string
  author: string
  pdf_url: string
  total_pages: number | null
}

const Page = React.forwardRef<HTMLDivElement, { pageImage: string; pageNumber: number }>(
  ({ pageImage, pageNumber }, ref) => (
    <div ref={ref} className="page-content bg-white flex flex-col items-center justify-center">
      <img
        src={pageImage}
        alt={`Page ${pageNumber}`}
        className="w-full h-full object-contain"
      />
    </div>
  )
)
Page.displayName = 'Page'

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return size
}

export default function ReadBookPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const [book, setBook] = useState<Book | null>(null)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const flipBookRef = useRef<{ pageFlip: () => { flipPrev: () => void; flipNext: () => void } }>(null)

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  // Calculate book dimensions based on screen size
  const bookDimensions = React.useMemo(() => {
    if (isMobile) {
      const pageWidth = Math.min(windowWidth - 80, 350)
      const pageHeight = Math.min(windowHeight - 200, pageWidth * 1.3)
      return {
        width: pageWidth,
        height: pageHeight,
        minWidth: 200,
        maxWidth: 350,
        minHeight: 280,
        maxHeight: 500,
        usePortrait: true,
      }
    }
    if (isTablet) {
      return {
        width: 350,
        height: 450,
        minWidth: 250,
        maxWidth: 400,
        minHeight: 350,
        maxHeight: 500,
        usePortrait: false,
      }
    }
    // Desktop
    return {
      width: 500,
      height: 600,
      minWidth: 300,
      maxWidth: 500,
      minHeight: 400,
      maxHeight: 600,
      usePortrait: false,
    }
  }, [isMobile, isTablet, windowWidth, windowHeight])

  useEffect(() => {
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()

      if (error) throw error
      setBook(data)
      await renderPdfPages(data.pdf_url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const renderPdfPages = async (pdfUrl: string) => {
    try {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise
      const totalPages = pdf.numPages
      const images: string[] = []

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const scale = 1.5
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height

        const context = canvas.getContext('2d')!
        await page.render({ canvasContext: context, viewport, canvas } as RenderParameters).promise

        images.push(canvas.toDataURL('image/png'))
        setLoadingProgress(Math.round((i / totalPages) * 100))
      }

      setPageImages(images)
      setLoading(false)
    } catch (err: unknown) {
      setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data)
  }, [])

  const goToPrev = () => {
    flipBookRef.current?.pageFlip()?.flipPrev()
  }

  const goToNext = () => {
    flipBookRef.current?.pageFlip()?.flipNext()
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-xl text-red-500 text-center">Error: {error}</p>
        <button
          onClick={() => router.push('/library')}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800"
        >
          Back to Library
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-xl text-black">Loading book...</p>
        <div className="w-64 h-3 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500">{loadingProgress}%</p>
      </div>
    )
  }

  if (windowWidth === 0) return null

  return (
    <div className="min-h-screen flex flex-col items-center py-4 sm:py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <button
          onClick={() => router.push('/library')}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-lg hover:bg-zinc-800 text-xs sm:text-sm shrink-0"
        >
          Back to Library
        </button>
        <div className="text-center min-w-0">
          <h1 className="text-sm sm:text-lg font-bold text-black truncate">{book?.title}</h1>
          <p className="text-xs sm:text-sm text-zinc-500 truncate">by {book?.author}</p>
        </div>
        <div className="text-xs sm:text-sm text-zinc-500 shrink-0">
          {currentPage + 1} / {pageImages.length}
        </div>
      </div>

      {/* Flipbook */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={goToPrev}
          disabled={currentPage === 0}
          className="p-2 sm:p-3 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-xl sm:text-2xl leading-none"
          aria-label="Previous page"
        >
          &#8249;
        </button>

        {/* @ts-ignore - react-pageflip types */}
        <HTMLFlipBook
          key={bookDimensions.usePortrait ? 'portrait' : 'landscape'}
          ref={flipBookRef}
          width={bookDimensions.width}
          height={bookDimensions.height}
          size="stretch"
          minWidth={bookDimensions.minWidth}
          maxWidth={bookDimensions.maxWidth}
          minHeight={bookDimensions.minHeight}
          maxHeight={bookDimensions.maxHeight}
          showCover={true}
          onFlip={onFlip}
          className="shadow-2xl rounded"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={600}
          usePortrait={bookDimensions.usePortrait}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          mobileScrollSupport={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pageImages.map((img, index) => (
            <Page key={index} pageImage={img} pageNumber={index + 1} />
          ))}
        </HTMLFlipBook>

        <button
          onClick={goToNext}
          disabled={currentPage >= pageImages.length - 1}
          className="p-2 sm:p-3 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-xl sm:text-2xl leading-none"
          aria-label="Next page"
        >
          &#8250;
        </button>
      </div>
    </div>
  )
}
