'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, X, FileText, ImageIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/schemas/onboarding'

interface FileUploadProps {
  label: string
  description?: string
  required?: boolean
  accept?: string
  multiple?: boolean
  value?: File | File[] | null
  onChange: (file: File | File[] | null) => void
  error?: string
  className?: string
}

export function FileUpload({
  label,
  description,
  required,
  accept = '.jpg,.jpeg,.png,.pdf',
  multiple = false,
  value,
  onChange,
  error,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const files = value
    ? Array.isArray(value)
      ? value
      : [value]
    : []

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return

    const fileArray = Array.from(newFiles)
    const validationError = validateFile(fileArray[0])
    if (validationError) return

    if (multiple) {
      onChange(fileArray)
    } else {
      onChange(fileArray[0])
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function removeFile(index: number) {
    if (multiple && Array.isArray(value)) {
      const updated = value.filter((_, i) => i !== index)
      onChange(updated.length > 0 ? updated : null)
    } else {
      onChange(null)
    }
  }

  function getFileIcon(file: File) {
    if (file.type === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />
    return <ImageIcon className="w-4 h-4 text-blue-500" />
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <span className="text-xs text-gray-400">{description}</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200',
          'hover:border-gray-400 hover:bg-gray-50/50',
          isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white',
          error && 'border-red-300 bg-red-50/30',
          files.length > 0 && 'border-green-300 bg-green-50/20'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <Upload className={cn(
                'w-8 h-8 transition-colors',
                isDragging ? 'text-gray-900' : 'text-gray-300'
              )} />
            )}
            <div>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">點擊上傳</span> 或拖曳檔案
              </p>
              <p className="text-xs text-gray-400 mt-0.5">JPG、PNG、PDF，最大 10MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(multiple || files.length === 0) && (
              <p className="text-xs text-center text-gray-400 pt-1">點擊繼續新增</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
