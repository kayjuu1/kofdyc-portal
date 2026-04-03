import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Star, Loader2, ImageIcon } from "lucide-react"

export interface UploadedImage {
  key: string
  url: string
  filename: string
  size: number
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onImagesChange: (images: UploadedImage[]) => void
  coverUrl: string | null
  onCoverChange: (url: string | null) => void
  maxFiles?: number
}

export function ImageUploader({
  images,
  onImagesChange,
  coverUrl,
  onCoverChange,
  maxFiles = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    const remaining = maxFiles - images.length
    if (remaining <= 0) {
      setError(`Maximum ${maxFiles} images allowed`)
      return
    }

    const filesToUpload = Array.from(fileList).slice(0, remaining)
    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      for (const file of filesToUpload) {
        formData.append("files", file)
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = (await res.json()) as { error?: string; files: UploadedImage[] }

      if (!res.ok) {
        setError(data.error ?? "Upload failed")
        return
      }

      const newImages = [...images, ...data.files]
      onImagesChange(newImages)

      // Auto-select first image as cover if none set
      if (!coverUrl && newImages.length > 0) {
        onCoverChange(newImages[0].url)
      }
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function removeImage(index: number) {
    const removed = images[index]
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)

    if (coverUrl === removed.url) {
      onCoverChange(newImages.length > 0 ? newImages[0].url : null)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={img.key}
              className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
                coverUrl === img.url
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <img
                src={img.url}
                alt={img.filename}
                className="w-full aspect-[4/3] object-cover"
              />

              {coverUrl === img.url && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Cover
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {coverUrl !== img.url && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7"
                    onClick={() => onCoverChange(img.url)}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Set Cover
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="text-xs h-7"
                  onClick={() => removeImage(i)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-xs truncate">{img.filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || images.length >= maxFiles}
        className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {images.length === 0 ? (
              <ImageIcon className="w-8 h-8" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
            <span className="text-sm">
              {images.length === 0
                ? "Click to upload images"
                : `Add more images (${images.length}/${maxFiles})`}
            </span>
            <span className="text-xs">JPEG, PNG, WebP, GIF — max 5MB each</span>
          </div>
        )}
      </button>
    </div>
  )
}
