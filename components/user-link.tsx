"use client"

import type React from "react"

import { useState } from "react"
import { UserProfileModal } from "./user-profile-modal"
import { useUserDisplayName } from "@/hooks/use-user-data"

interface UserLinkProps {
  userId: string
  children?: React.ReactNode
  className?: string
  showName?: boolean
}

export function UserLink({ userId, children, className = "", showName = false }: UserLinkProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const displayName = useUserDisplayName(userId)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`text-teal-600 hover:text-teal-700 hover:underline cursor-pointer transition-colors font-normal ${className}`}
      >
        {children || (showName ? displayName : userId)}
      </button>

      <UserProfileModal userId={userId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

export default UserLink
