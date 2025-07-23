import React, { createContext, ReactNode, useEffect } from 'react'
import { useAuthCheck } from '../hooks/useAuth'
import { updateGlobalAuthState } from '../utils/authHelpers'
import { setCurrentAuthUser } from '../store/useUserStore'

interface AuthUser {
  username: string
  userId: string
}

export interface AuthContextType {
  isAuthenticated: boolean | null
  authUser: AuthUser | null
  isLoading: boolean
  username: string | null
  userId: string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authData = useAuthCheck()

  useEffect(() => {
    updateGlobalAuthState({
      username: authData.username,
      userId: authData.userId,
      isAuthenticated: authData.isAuthenticated
    })
    
    // Update the user store with auth data
    if (authData.authUser) {
      setCurrentAuthUser(authData.authUser)
    } else {
      setCurrentAuthUser(null)
    }
  }, [authData.username, authData.userId, authData.isAuthenticated, authData.authUser])

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  )
}