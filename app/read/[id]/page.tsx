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
    <div ref={ref} className="page-content bg-[#FFF8E7] flex flex-col items-center justify-center">
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

  const bookDimensions = React.useMemo(() => {
    if (isMobile) {
      const pageWidth = Math.min(windowWidth - 60, 380)
      const pageHeight = Math.min(windowHeight - 180, pageWidth * 1.4)
      return {
        width: pageWidth,
        height: pageHeight,
        minWidth: 250,
        maxWidth: 400,
        minHeight: 320,
        maxHeight: 560,
        usePortrait: true,
      }
    }
    if (isTablet) {
      return {
        width: 420,
        height: 560,
        minWidth: 300,
        maxWidth: 480,
        minHeight: 400,
        maxHeight: 600,
        usePortrait: false,
      }
    }
    // Desktop - fit within viewport (header ~100px, title ~80px, hint ~30px, padding ~40px)
    const availH = windowHeight - 280
    const pageH = Math.min(Math.max(availH, 400), 680)
    const pageW = Math.round(pageH * 0.75)
    return {
      width: Math.max(pageW, 400),
      height: pageH,
      minWidth: 350,
      maxWidth: 600,
      minHeight: 400,
      maxHeight: 680,
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
        <p className="text-xl text-red-400 text-center font-bold">Error: {error}</p>
        <button
          onClick={() => router.push('/library')}
          className="px-6 py-3 bg-[#22C55E] text-[#0B3D1C] rounded-full font-black shadow-[0_6px_0_#166534] hover:shadow-[0_4px_0_#166534] hover:translate-y-[2px] active:shadow-[0_0px_0_#166534] active:translate-y-[6px] transition-all"
          style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
        >
          Back to Library
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        {/* Book opening animation */}
        <div className="relative w-24 h-32">
          <div
            className="absolute inset-0 rounded-r-md bg-[#8B5E34] shadow-lg"
            style={{ transformOrigin: 'left', animation: 'book-open 1.5s ease-in-out infinite' }}
          />
          <div className="absolute inset-0 rounded-r-md bg-[#D4A76A] border-2 border-[#8B5E34]/30" />
          <div className="absolute top-2 bottom-2 left-3 right-2 rounded-sm bg-[#FFF8E7]">
            <div className="h-2 bg-[#D4A76A]/30 rounded m-2 mt-4 w-3/4" />
            <div className="h-2 bg-[#D4A76A]/30 rounded m-2 w-1/2" />
            <div className="h-2 bg-[#D4A76A]/30 rounded m-2 w-2/3" />
          </div>
        </div>
        <p
          className="text-2xl font-black text-[#D4A76A]"
          style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
        >
          Opening book...
        </p>
        <div className="w-64 h-4 bg-[#5C3D1E] rounded-full overflow-hidden border-2 border-[#8B5E34]">
          <div
            className="h-full bg-gradient-to-r from-[#D4A76A] to-[#FFD93D] rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-sm text-[#D4A76A]/70 font-bold">{loadingProgress}% pages ready</p>
      </div>
    )
  }

  if (windowWidth === 0) return null

  return (
    <div className="flex-1 flex flex-col items-center px-2 sm:px-4 py-2 sm:py-3">
      {/* Title & info centered */}
      <div className="w-full max-w-5xl mb-2 sm:mb-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/library')}
            className="px-4 py-2 bg-[#22C55E] text-[#0B3D1C] rounded-full font-black text-xs sm:text-sm shadow-[0_4px_0_#166534] hover:shadow-[0_2px_0_#166534] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
            style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
          >
            Back to Library
          </button>
          <div
            className="text-xs sm:text-sm text-[#D4A76A] font-bold bg-[#5C3D1E] px-3 py-1 rounded-full border border-[#8B5E34]"
            style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
          >
            {currentPage + 1} / {pageImages.length}
          </div>
        </div>
        <h1
          className="text-xl sm:text-3xl font-black text-[#D4A76A] text-center"
          style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
        >
          {book?.title}
        </h1>
        <p className="text-xs sm:text-sm text-white/50 text-center font-medium">by {book?.author}</p>
      </div>

      {/* Book + navigation */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Previous */}
          <button
            onClick={goToPrev}
            disabled={currentPage === 0}
            className="p-2.5 sm:p-4 rounded-full bg-[#5C3D1E] text-[#D4A76A] border-2 border-[#8B5E34] hover:bg-[#8B5E34] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg"
            aria-label="Previous page"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Book */}
          <div className="relative">
            {/* Shadow under the book */}
            <div className="absolute -bottom-6 left-6 right-6 h-10 rounded-[50%] bg-black/40 blur-xl" />

            {/* Outer book cover / binding */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                padding: '8px 6px 8px 14px',
                background: 'linear-gradient(135deg, #6B4226 0%, #8B5E34 30%, #A0714F 60%, #8B5E34 100%)',
                boxShadow: '0 15px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)',
              }}
            >
              {/* Spine ridge lines */}
              <div className="absolute left-0 top-0 bottom-0 w-3" style={{
                background: 'linear-gradient(to right, #4A2C0A, #6B4226 40%, #8B5E34 60%, #6B4226)',
                boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.4), 1px 0 2px rgba(255,255,255,0.05)',
              }} />

              {/* Inner page area */}
              <div
                className="relative bg-[#FFF8E7] rounded-r-sm overflow-hidden"
                style={{
                  boxShadow: 'inset 3px 0 8px rgba(0,0,0,0.08), inset 0 2px 4px rgba(0,0,0,0.04)',
                }}
              >
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
                  className="book-flipbook"
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
              </div>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={goToNext}
            disabled={currentPage >= pageImages.length - 1}
            className="p-2.5 sm:p-4 rounded-full bg-[#5C3D1E] text-[#D4A76A] border-2 border-[#8B5E34] hover:bg-[#8B5E34] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg"
            aria-label="Next page"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="mt-2 text-xs text-white/30 font-medium text-center">
        Click the page edges or swipe to flip
      </p>
    </div>
  )
}
