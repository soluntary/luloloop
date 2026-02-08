"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2, X } from "lucide-react"

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
  name?: string
  address?: Record<string, string>
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

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        // Use multiple search strategies for better results
        const urls = [
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(value)}&countrycodes=de,at,ch`,
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(value + "*")}&countrycodes=de,at,ch`,
        ]

        let allResults: AddressSuggestion[] = []
        for (const url of urls) {
          try {
            const response = await fetch(url, {
              headers: { "User-Agent": "LudoLoop/1.0 (contact@ludoloop.com)" },
            })
            const results = await response.json()
            if (results && results.length > 0) {
              allResults = [...allResults, ...results]
            }
          } catch {
            // continue
          }
          if (allResults.length >= 5) break
        }

        // Deduplicate by place_id
        const seen = new Set<string>()
        const data = allResults.filter((item) => {
          const id = String(item.place_id)
          if (seen.has(id)) return false
          seen.add(id)
          return true
        }).slice(0, 8)

        setSuggestions(data)
        setShowSuggestions(data.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error("Autocomplete error:", error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  const formatSuggestion = (suggestion: AddressSuggestion) => {
    const parts = suggestion.display_name.split(",").map((p) => p.trim())
    const mainText = suggestion.name || parts[0]
    const secondaryText = parts.slice(1, 3).join(", ")
    return { mainText, secondaryText }
  }

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  const handleCloseSuggestions = () => {
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
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
            const { mainText, secondaryText } = formatSuggestion(suggestion)

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
                    {secondaryText && (
                      <span className="text-sm text-gray-500 ml-2">{secondaryText}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
