'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { zhTW } from 'date-fns/locale'
import { format } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// ──────────────────────────────────────────────
// 格式轉換工具
// ──────────────────────────────────────────────

/** 民國年7碼 YYYMMDD → Date（e.g. '1040401' → 2015-04-01） */
function roc7ToDate(str: string): Date | undefined {
  if (!str || str.length !== 7 || !/^\d{7}$/.test(str)) return undefined
  const rocYear = parseInt(str.slice(0, 3), 10)
  const month = parseInt(str.slice(3, 5), 10) - 1
  const day = parseInt(str.slice(5, 7), 10)
  const year = rocYear + 1911
  const d = new Date(year, month, day)
  if (isNaN(d.getTime())) return undefined
  return d
}

/** Date → 民國年7碼 YYYMMDD */
function dateToRoc7(date: Date): string {
  const rocYear = date.getFullYear() - 1911
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${rocYear}${mm}${dd}`
}

/** 西元年8碼 YYYYMMDD → Date（e.g. '20001213' → 2000-12-13） */
function gregorian8ToDate(str: string): Date | undefined {
  if (!str || str.length !== 8 || !/^\d{8}$/.test(str)) return undefined
  const year = parseInt(str.slice(0, 4), 10)
  const month = parseInt(str.slice(4, 6), 10) - 1
  const day = parseInt(str.slice(6, 8), 10)
  const d = new Date(year, month, day)
  if (isNaN(d.getTime())) return undefined
  return d
}

/** Date → 西元年8碼 YYYYMMDD */
function dateToGregorian8(date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

export type DatePickerFormat = 'roc7' | 'gregorian8'

interface DatePickerProps {
  /** 儲存值（schema 格式：roc7 = 7碼民國年、gregorian8 = 8碼西元年） */
  value?: string
  onChange: (value: string) => void
  /** 格式類型 */
  format: DatePickerFormat
  placeholder?: string
  disabled?: boolean
  error?: boolean
  /** 可選最早日期（預設無限制） */
  minDate?: Date
  /** 可選最晚日期（預設今天） */
  maxDate?: Date
}

const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// ──────────────────────────────────────────────
// 元件
// ──────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  format: fmt,
  placeholder,
  disabled,
  error,
  minDate,
  maxDate = new Date(),
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'yearMonth' | 'year'>('day')

  // 將 schema string 轉換成 Date
  const selected: Date | undefined =
    fmt === 'roc7' ? roc7ToDate(value ?? '') : gregorian8ToDate(value ?? '')

  // 控制 DayPicker 顯示的月份
  const [calendarMonth, setCalendarMonth] = useState<Date>(selected ?? new Date())
  // 年月選擇器顯示的年份
  const [yearView, setYearView] = useState<number>((selected ?? new Date()).getFullYear())
  // 年份格子顯示的起點（一次顯示 12 年）
  const [yearGridStart, setYearGridStart] = useState<number>(
    Math.floor((selected ?? new Date()).getFullYear() / 12) * 12
  )

  // 顯示用文字
  const displayText = selected
    ? fmt === 'roc7'
      ? `民國 ${selected.getFullYear() - 1911} 年 ${format(selected, 'M 月 d 日')}`
      : format(selected, 'yyyy 年 M 月 d 日')
    : null

  function handleSelect(date: Date | undefined) {
    if (!date) return
    onChange(fmt === 'roc7' ? dateToRoc7(date) : dateToGregorian8(date))
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (o) {
      // 重設到選取日期或今天
      const base = selected ?? new Date()
      setCalendarMonth(base)
      setYearView(base.getFullYear())
      setYearGridStart(Math.floor(base.getFullYear() / 12) * 12)
      setViewMode('day')
    }
  }

  function handleMonthSelect(monthIndex: number) {
    const newMonth = new Date(yearView, monthIndex, 1)
    setCalendarMonth(newMonth)
    setViewMode('day')
  }

  function handleYearSelect(year: number) {
    setYearView(year)
    setViewMode('yearMonth')
  }

  // 年份格子顯示的範圍（12 年一頁）
  const yearGrid = Array.from({ length: 12 }, (_, i) => yearGridStart + i)
  const maxYear = maxDate?.getFullYear() ?? new Date().getFullYear()
  const minYear = minDate?.getFullYear() ?? 1900

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors',
          'bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/20',
          error
            ? 'border-red-300 focus:ring-red-200'
            : 'border-gray-200 focus:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50',
          !displayText && 'text-gray-400'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {displayText ?? (placeholder ?? '請選擇日期')}
        </span>
        {value ? (
          <X
            className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
            onClick={handleClear}
          />
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        className="w-auto p-0 rounded-2xl overflow-hidden"
      >

        {/* 年份格子（一次顯示 12 年） */}
        {viewMode === 'year' ? (
          <div className="p-3 w-[280px]">
            {/* 上一頁／下一頁 12 年 */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setYearGridStart(s => s - 12)}
                disabled={yearGridStart <= minYear}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {fmt === 'roc7'
                  ? `民國 ${yearGridStart - 1911} – ${yearGridStart + 11 - 1911} 年`
                  : `${yearGridStart} – ${yearGridStart + 11}`}
              </span>
              <button
                type="button"
                onClick={() => setYearGridStart(s => s + 12)}
                disabled={yearGridStart + 12 > maxYear}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 年份格子 */}
            <div className="grid grid-cols-3 gap-1.5">
              {yearGrid.map((y) => {
                const isSelected = selected && selected.getFullYear() === y
                const isDisabled = y < minYear || y > maxYear
                const isCurrentYear = y === new Date().getFullYear()
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleYearSelect(y)}
                    className={cn(
                      'h-9 rounded-lg text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : isCurrentYear
                          ? 'text-gray-900 ring-1 ring-gray-300 hover:bg-gray-100'
                          : 'text-gray-700 hover:bg-gray-100',
                      isDisabled && 'text-gray-200 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {fmt === 'roc7' ? y - 1911 : y}
                  </button>
                )
              })}
            </div>
          </div>
        ) : viewMode === 'yearMonth' ? (
          <div className="p-3 w-[280px]">
            {/* 年份導覽 — 點中間文字可切到年份格子 */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setYearView(y => y - 1)}
                disabled={yearView <= minYear}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setYearGridStart(Math.floor(yearView / 12) * 12)
                  setViewMode('year')
                }}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors px-2 py-0.5 rounded"
              >
                {fmt === 'roc7' ? `民國 ${yearView - 1911} 年` : `${yearView} 年`}
              </button>
              <button
                type="button"
                onClick={() => setYearView(y => y + 1)}
                disabled={maxDate ? yearView >= maxDate.getFullYear() : false}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 月份格子 */}
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS_ZH.map((m, i) => {
                const isSelected =
                  selected &&
                  selected.getFullYear() === yearView &&
                  selected.getMonth() === i
                const isDisabled =
                  (minDate && new Date(yearView, i + 1, 0) < minDate) ||
                  (maxDate && new Date(yearView, i, 1) > maxDate)
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={!!isDisabled}
                    onClick={() => handleMonthSelect(i)}
                    className={cn(
                      'h-9 rounded-lg text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100',
                      isDisabled && 'text-gray-200 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            locale={zhTW}
            showOutsideDays
            classNames={{
              root: 'p-3',
              months: 'flex flex-col',
              month: 'space-y-2',
              month_caption: 'flex items-center justify-between px-1 py-1',
              caption_label: 'text-sm font-semibold text-gray-900',
              nav: 'flex items-center gap-1',
              button_previous: cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200',
                'text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
              ),
              button_next: cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200',
                'text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
              ),
              weeks: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'w-9 text-center text-xs font-medium text-gray-400 py-1',
              week: 'flex mt-1',
              day: 'w-9 h-9 text-center text-sm p-0',
              day_button: cn(
                'w-9 h-9 rounded-lg text-sm font-normal transition-colors',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/20'
              ),
              selected: '[&>button]:bg-gray-900 [&>button]:text-white [&>button]:hover:bg-gray-800',
              today: '[&>button]:font-bold [&>button]:text-gray-900 [&>button]:ring-1 [&>button]:ring-gray-300',
              outside: '[&>button]:text-gray-300 [&>button]:hover:bg-gray-50',
              disabled: '[&>button]:text-gray-200 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
              hidden: 'invisible',
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                ),
              // 月份標題改成可點擊，切換到年月選擇器；roc7 顯示民國年
              CaptionLabel: () => (
                <button
                  type="button"
                  onClick={() => {
                    setYearView(calendarMonth.getFullYear())
                    setViewMode('yearMonth')
                  }}
                  className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors px-1 rounded"
                >
                  {fmt === 'roc7'
                    ? `民國 ${calendarMonth.getFullYear() - 1911} 年 ${calendarMonth.getMonth() + 1} 月`
                    : `${calendarMonth.getFullYear()} 年 ${calendarMonth.getMonth() + 1} 月`}
                </button>
              ),
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
