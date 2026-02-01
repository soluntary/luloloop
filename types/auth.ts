export interface AuthUser {
  id: string
  email: string
  name: string
  username?: string
  avatar?: string
  bio?: string
  website?: string
  twitter?: string
  instagram?: string
  settings?: any
}

export interface SignUpResult {
  success: boolean
  needsEmailConfirmation?: boolean
  message?: string
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string, username?: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>
  networkError: boolean
  retryCount: number
}
