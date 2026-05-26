'use client'

import { useRef, useState } from 'react'
import { Upload, X, FileText, ImageIcon, CheckCircle2, Loader2, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/schemas/onboarding'
import { toast } from 'sonner'
import { isUploadedFile, type UploadedFile } from '@/types/merchant'

type AnyFile = File | UploadedFile

interface FileUploadProps {
  label: string
  /** 短格式提示，顯示於標題右側（如 "JPG · PNG"） */
  hint?: string
  /** 較長的說明文字，顯示於標題下方 */
  description?: string
  required?: boolean
  accept?: string
  multiple?: boolean
  /** 多檔上傳時的最大數量限制 */
  maxFiles?: number
  value?: AnyFile | AnyFile[] | null
  onChange: (file: AnyFile | AnyFile[] | null) => void
  /** 若提供，選檔後立即上傳至 Storage；onChange 回傳 UploadedFile */
  uploadFn?: (file: File) => Promise<UploadedFile>
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
  maxFiles,
  value,
  onChange,
  uploadFn,
  error,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const files: AnyFile[] = value ? (Array.isArray(value) ? value : [value]) : []
  const atLimit = !!maxFiles && files.length >= maxFiles
  const canAdd = !isUploading && !atLimit
  const showFileList = files.length > 0 || isUploading

  async function handleFiles(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return
    if (!canAdd) return

    const fileArray = Array.from(newFiles)

    for (const file of fileArray) {
      const err = validateFile(file)
      if (err) { toast.error(err); return }
    }

    if (uploadFn) {
      setIsUploading(true)
      try {
        const uploaded = await Promise.all(fileArray.map(f => uploadFn(f)))
        if (multiple) {
          const merged = [...files, ...uploaded]
          const limited = maxFiles ? merged.slice(0, maxFiles) : merged
          onChange(limited.length > 0 ? limited : null)
        } else {
          onChange(uploaded[0])
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '上傳失敗，請重試')
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    } else {
      // 無 uploadFn：直接回傳 File（不即時上傳模式）
      if (multiple) {
        const merged = [...files, ...fileArray]
        const limited = maxFiles ? merged.slice(0, maxFiles) : merged
        onChange(limited.length > 0 ? limited : null)
      } else {
        onChange(fileArray[0])
      }
    }
  }

  function removeFile(index: number) {
    if (multiple && Array.isArray(value)) {
      const updated = value.filter((_, i) => i !== index)
      onChange(updated.length > 0 ? updated : null)
    } else {
      onChange(null)
    }
  }

  function getFileIcon(file: AnyFile) {
    if (file.type === 'application/pdf') return <FileText className="w-3.5 h-3.5 text-red-400" />
    return <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
  }

  function formatSize(bytes: number): string {
    if (!bytes || isNaN(bytes)) return '—'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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

      {/* 說明文字 */}
      {description && (
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      )}

      {/* 上傳區 */}
      <div
        onClick={() => { if (canAdd) inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); if (canAdd) setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); void handleFiles(e.dataTransfer.files) }}
        className={cn(
          'border border-dashed rounded-lg transition-all duration-150',
          canAdd ? 'cursor-pointer hover:border-gray-400 hover:bg-gray-50/50' : 'cursor-default',
          isDragging && 'border-gray-600 bg-gray-50',
          !isDragging && !showFileList && !error && 'border-gray-200 bg-white',
          error && !showFileList && 'border-red-300 bg-red-50/30',
          showFileList && 'border-green-300 bg-green-50/20',
          canAdd && showFileList && 'hover:bg-green-50/40',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => { void handleFiles(e.target.files) }}
        />

        {!showFileList ? (
          /* 空狀態 */
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
          /* 檔案列表 */
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
                {isUploadedFile(file)
                  ? <Cloud className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                }
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* 上傳中 */}
            {isUploading && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 border border-blue-100">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                <p className="text-xs text-blue-600">上傳中...</p>
              </div>
            )}

            {/* 繼續新增 / 已達上限 */}
            {multiple && !isUploading && !atLimit && (
              <p className="text-xs text-center text-gray-400 pb-1">點擊繼續新增</p>
            )}
            {multiple && atLimit && (
              <p className="text-xs text-center text-orange-500 pb-1">已達上限（最多 {maxFiles} 份）</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
