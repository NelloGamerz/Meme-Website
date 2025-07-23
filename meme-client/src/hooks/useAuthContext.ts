import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '../context/AuthContext'

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}