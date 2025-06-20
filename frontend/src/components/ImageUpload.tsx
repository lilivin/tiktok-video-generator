import React, { useState, useRef } from 'react'
import { Upload, X, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: File | string | null
  onChange: (file: File | null) => void
  error?: string
  disabled?: boolean
  className?: string
}

export function ImageUpload({ 
  value, 
  onChange, 
  error, 
  disabled = false, 
  className 
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate preview URL when value changes
  React.useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (typeof value === 'string') {
      setPreviewUrl(value)
    } else {
      setPreviewUrl(null)
    }
  }, [value])

  const validateFile = (file: File): string | null => {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return 'Plik jest za duży. Maksymalny rozmiar to 5MB.'
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return 'Nieobsługiwany format pliku. Akceptowane formaty: JPG, PNG.'
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    
    if (validationError) {
      // Show error but don't update the form value
      return
    }

    onChange(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validationError = validateFile(file)
      if (validationError) {
        // Reset input and show error via form validation
        e.target.value = ''
        return
      }
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleRemove = () => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          'hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          isDragOver && 'border-primary bg-primary/10',
          error && 'border-destructive bg-destructive/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !previewUrl && 'border-muted-foreground/25',
          previewUrl ? 'p-2' : 'p-6'
        )}
      >
        {previewUrl ? (
          // Preview mode
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Podgląd obrazu"
              className="w-full h-32 object-cover rounded-md"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Upload mode
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-2">
              {error ? (
                <AlertCircle className="h-12 w-12 text-destructive" />
              ) : (
                <ImageIcon className="h-12 w-12" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {error ? 'Błąd przesyłania' : 'Dodaj obraz'}
              </p>
              <p className="text-xs text-muted-foreground">
                Przeciągnij i upuść lub kliknij, aby wybrać
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG (maks. 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* File info */}
      {value instanceof File && !error && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Nazwa: {value.name}</p>
          <p>Rozmiar: {(value.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  )
} 