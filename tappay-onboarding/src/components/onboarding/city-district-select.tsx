'use client'

import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { TAIWAN_CITIES, findZip, parseCityDistrict } from '@/lib/taiwan-districts'
import type { OnboardingFormData } from '@/types/merchant'

interface Props {
  postalCodeField: string
  cityField: string
  postalLabel?: string
  cityLabel?: string
  required?: boolean
}

const selectClass =
  'h-10 w-full appearance-none rounded-xl border border-input bg-background pl-3 pr-8 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

export function CityDistrictSelect({
  postalCodeField,
  cityField,
  postalLabel = '郵遞區號',
  cityLabel = '縣市地區',
  required = true,
}: Props) {
  const { setValue, watch, register } = useFormContext<OnboardingFormData>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentCity = (watch as any)(cityField) as string | undefined

  const [selectedCity, setSelectedCity] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  // Parse existing form value on mount
  useEffect(() => {
    if (currentCity) {
      const parsed = parseCityDistrict(currentCity)
      if (parsed.city) {
        setSelectedCity(parsed.city)
        setSelectedDistrict(parsed.district)
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const districts = TAIWAN_CITIES.find((c) => c.name === selectedCity)?.districts ?? []

  function handleCityChange(city: string) {
    setSelectedCity(city)
    setSelectedDistrict('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(setValue as any)(cityField, city)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(setValue as any)(postalCodeField, '')
  }

  function handleDistrictChange(district: string) {
    setSelectedDistrict(district)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(setValue as any)(cityField, selectedCity + district)
    const zip = findZip(selectedCity, district)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(setValue as any)(postalCodeField, zip)
  }

  return (
    <div className="md:col-span-2 space-y-1.5">
      <div className="flex items-center gap-1">
        <Label className="text-sm font-medium text-gray-700">
          {cityLabel}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      </div>
      <div className="flex gap-2 items-center">
        {/* Postal code — small, auto-filled */}
        <div className="w-24 shrink-0">
          <Input
            placeholder="郵遞區號"
            maxLength={3}
            readOnly
            className="h-10 rounded-xl bg-gray-50 text-center text-sm"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(register as any)(postalCodeField)}
          />
        </div>

        {/* 縣市 dropdown */}
        <div className="relative flex-1">
          <select
            className={selectClass}
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
          >
            <option value="">請選擇縣市</option>
            {TAIWAN_CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {/* 區 dropdown */}
        <div className="relative flex-1">
          <select
            className={selectClass}
            value={selectedDistrict}
            disabled={!selectedCity}
            onChange={(e) => handleDistrictChange(e.target.value)}
          >
            <option value="">請選擇區</option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
