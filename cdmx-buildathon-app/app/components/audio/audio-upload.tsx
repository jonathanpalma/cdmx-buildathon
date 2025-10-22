import { useState, useCallback } from "react"
import { Upload, FileAudio, X } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { cn } from "~/lib/utils"

interface AudioUploadProps {
  onFileSelect: (file: File) => void
  acceptedFormats?: string[]
  maxSizeMB?: number
}

export function AudioUpload({
  onFileSelect,
  acceptedFormats = [".mp3", ".wav", ".m4a", ".ogg", ".mp4", ".webm"],
  maxSizeMB = 50,
}: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const extension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!acceptedFormats.includes(extension)) {
      return `Please upload a valid audio file (${acceptedFormats.join(", ")})`
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return `File size must be less than ${maxSizeMB}MB`
    }

    return null
  }

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)
      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setError(null)
  }, [])

  return (
    <Card
      className={cn(
        "p-8 border-2 border-dashed transition-colors",
        isDragging && "border-blue-500 bg-blue-50",
        error && "border-red-500 bg-red-50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {!selectedFile ? (
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div
            className={cn(
              "rounded-full p-4 transition-colors",
              isDragging ? "bg-blue-100" : "bg-gray-100"
            )}
          >
            <Upload className={cn("h-8 w-8", isDragging ? "text-blue-600" : "text-gray-600")} />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Upload Audio Sample</h3>
            <p className="text-sm text-gray-600">
              Drag and drop your audio file here, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports: {acceptedFormats.join(", ")} (max {maxSizeMB}MB)
            </p>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept={acceptedFormats.join(",")}
              onChange={handleFileInput}
              className="hidden"
            />
            <Button type="button" variant="outline">
              Browse Files
            </Button>
          </label>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">{error}</div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full p-3 bg-green-100">
              <FileAudio className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="text-gray-500 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </Card>
  )
}
