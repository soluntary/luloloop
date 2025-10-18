"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2 } from "lucide-react"

interface AddressAutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: string
}

export function AddressAutocompleteInput({
  value,
  onChange,
  placeholder = "Adresse eingeben...",
  className = "",
}: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Fetch address suggestions from Nominatim (OpenStreetMap)
  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(value)}&countrycodes=de,at,ch`,
        )
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error("[v0] Autocomplete error:", error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  return (
    <div className="relative">
      <div className="relative">
        {isLoadingSuggestions ? (
          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10 animate-spin" />
        ) : (
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? "bg-teal-50 border-teal-200" : ""
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{suggestion.display_name.split(",")[0]}</p>
                  <p className="text-xs text-gray-500 truncate">{suggestion.display_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
