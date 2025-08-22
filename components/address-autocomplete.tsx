"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"
import { getAddressSuggestions } from "@/lib/actions/geocoding"

interface AddressSuggestion {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

interface AddressAutocompleteProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  className?: string
  error?: string
}

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  className = "",
  error,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const addressSuggestions = await getAddressSuggestions(value)
        setSuggestions(addressSuggestions)
        setShowSuggestions(addressSuggestions.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error("Address autocomplete error:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

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
      <Label className="text-sm font-medium text-gray-700 mb-2 block">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          className={`h-10 border-2 border-indigo-200 focus:border-indigo-500 rounded-lg pr-10 ${className}`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? "bg-indigo-50 border-indigo-200" : ""
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description.split(",")[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting?.secondary_text || suggestion.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 bg-red-50 p-2 rounded-lg">
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
