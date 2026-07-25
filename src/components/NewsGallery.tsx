import { useCallback, useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface NewsGalleryProps {
  /** Ordered image URLs. The cover is expected to be excluded by the caller. */
  urls: string[]
  title: string
}

export function NewsGallery({ urls, title }: NewsGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? current : (current + delta + urls.length) % urls.length,
      ),
    [urls.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close()
      if (event.key === "ArrowRight") step(1)
      if (event.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    // Stop the page scrolling behind the lightbox
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [openIndex, close, step])

  if (urls.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-serif text-xl font-semibold">Gallery</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`View image ${index + 1} of ${urls.length} from ${title}`}
          >
            <img
              src={url}
              alt={`${title} — image ${index + 1}`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} gallery`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close gallery"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          {urls.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}

          <img
            src={urls[openIndex]}
            alt={`${title} — image ${openIndex + 1}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          <p className="absolute bottom-4 text-sm text-white/70">
            {openIndex + 1} / {urls.length}
          </p>
        </div>
      ) : null}
    </section>
  )
}
