"use client"

import type React from "react"

import { useState } from "react"
import { UserProfileModal } from "./user-profile-modal"
import { useUserDisplayName } from "@/hooks/use-user-data"
import { useAuth } from "@/contexts/auth-context"

interface UserLinkProps {
  userId: string
  children?: React.ReactNode
  className?: string
  showName?: boolean
}

export function UserLink({ userId, children, className = "", showName = false }: UserLinkProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const displayName = useUserDisplayName(userId)
  const { user } = useAuth() || { user: null }

  // Nicht angemeldete Nutzer können nicht auf Benutzernamen klicken
  if (!user) {
    return (
      <span className={className}>
        {children || (showName ? displayName : userId)}
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {children || (showName ? displayName : userId)}
      </button>

      <UserProfileModal userId={userId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

export default UserLink
