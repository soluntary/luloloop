"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2, X } from "lucide-react"
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
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const addressSuggestions = await getAddressSuggestions(value)
        setSuggestions(addressSuggestions)
        setShowSuggestions(addressSuggestions.length > 0 && isFocused)
        setSelectedIndex(-1)
      } catch (error) {
        console.error("Address autocomplete error:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value, isFocused])

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description)
    setIsFocused(false)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleCloseSuggestions = () => {
    setShowSuggestions(false)
    setSelectedIndex(-1)
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
        handleCloseSuggestions()
        break
    }
  }

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false)
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (value.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true)
    }
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
          onFocus={handleFocus}
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
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <span className="text-xs text-gray-500 font-medium">
              {"Vorschläge powered by "}
              <span className="font-semibold text-gray-700">OpenStreetMap</span>
            </span>
            <button
              type="button"
              onClick={handleCloseSuggestions}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Suggestions list */}
          {suggestions.map((suggestion, index) => {
            const mainText = suggestion.structured_formatting?.main_text || suggestion.description.split(",")[0]
            const secondaryText = suggestion.structured_formatting?.secondary_text || suggestion.description

            return (
              <div
                key={suggestion.place_id}
                className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${index === selectedIndex
                    ? "bg-teal-50 border-l-2 border-l-teal-500"
                    : "hover:bg-gray-50 border-l-2 border-l-transparent"
                  }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-4 h-4 flex-shrink-0 ${index === selectedIndex ? "text-teal-500" : "text-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{mainText}</span>
                    {secondaryText && secondaryText !== mainText && (
                      <span className="text-sm text-gray-500 ml-2">{secondaryText}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
