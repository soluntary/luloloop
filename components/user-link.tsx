"use client"

import type React from "react"

import { useState } from "react"
import { UserProfileModal } from "./user-profile-modal"

interface UserLinkProps {
  userId: string
  children: React.ReactNode
  className?: string
}

export function UserLink({ userId, children, className = "" }: UserLinkProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`text-teal-600 hover:text-teal-700 hover:underline cursor-pointer transition-colors ${className}`}
      >
        {children}
      </button>

      <UserProfileModal userId={userId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
