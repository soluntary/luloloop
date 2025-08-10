"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface Message {
  id: number
  fromUser: string
  toUser: string
  gameTitle: string
  gameId: number
  offerType: 'lend' | 'trade' | 'sell'
  message: string
  timestamp: string
  read: boolean
  gameImage: string
}

interface MessagesContextType {
  messages: Message[]
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (messageId: number) => void
  deleteMessage: (messageId: number) => void
  getUnreadCount: (username: string) => number
  getUserMessages: (username: string) => Message[]
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load messages from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('ludoloop_messages')
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
      }
      setIsLoaded(true)
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('ludoloop_messages', JSON.stringify(messages))
    }
  }, [messages, isLoaded])

  const sendMessage = (messageData: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    const newMessage: Message = {
      ...messageData,
      id: Math.max(...messages.map(m => m.id), 0) + 1,
      timestamp: new Date().toISOString(),
      read: false
    }
    setMessages(prev => [...prev, newMessage])
  }

  const markAsRead = (messageId: number) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    )
  }

  const deleteMessage = (messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  const getUnreadCount = (username: string) => {
    return messages.filter(msg => msg.toUser === username && !msg.read).length
  }

  const getUserMessages = (username: string) => {
    return messages
      .filter(msg => msg.toUser === username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  return (
    <MessagesContext.Provider value={{
      messages,
      sendMessage,
      markAsRead,
      deleteMessage,
      getUnreadCount,
      getUserMessages
    }}>
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider')
  }
  return context
}
