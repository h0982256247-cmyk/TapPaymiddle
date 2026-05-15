'use client'

import { useRef, useState } from 'react'
import { Upload, X, FileText, ImageIcon, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/schemas/onboarding'

interface FileUploadProps {
  label: string
  /** 短格式提示，顯示於標題右側（如 "JPG · PNG"） */
  hint?: string
  /** 較長的說明文字，顯示於標題下方 */
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
  hint,
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

  const files = value ? (Array.isArray(value) ? value : [value]) : []

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return
    const fileArray = Array.from(newFiles)
    const validationError = validateFile(fileArray[0])
    if (validationError) return
    onChange(multiple ? fileArray : fileArray[0])
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
    if (file.type === 'application/pdf') return <FileText className="w-3.5 h-3.5 text-red-400" />
    return <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const hasFile = files.length > 0

  return (
    <div className={cn('space-y-1', className)}>
      {/* 標題列 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700 leading-tight">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-xs text-gray-400 flex-shrink-0">{hint}</span>}
      </div>

      {/* 說明文字（較長） */}
      {description && (
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      )}

      {/* 上傳區 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
        className={cn(
          'border border-dashed rounded-lg cursor-pointer transition-all duration-150',
          'hover:border-gray-400 hover:bg-gray-50/50',
          isDragging && 'border-gray-600 bg-gray-50',
          !isDragging && !hasFile && !error && 'border-gray-200 bg-white',
          error && !hasFile && 'border-red-300 bg-red-50/30',
          hasFile && 'border-green-300 bg-green-50/20 hover:bg-green-50/40',
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

        {!hasFile ? (
          /* 空狀態：精簡橫列 */
          <div className="flex items-center justify-center gap-2 py-3 px-4">
            <Upload className={cn(
              'w-4 h-4 flex-shrink-0 transition-colors',
              isDragging ? 'text-gray-600' : 'text-gray-300'
            )} />
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-600">點擊上傳</span>
              <span className="text-gray-400"> 或拖曳</span>
            </p>
          </div>
        ) : (
          /* 已上傳：檔案列表 */
          <div className="p-2 space-y-1.5">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">{file.name}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {multiple && (
              <p className="text-xs text-center text-gray-400 pb-1">點擊繼續新增</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
