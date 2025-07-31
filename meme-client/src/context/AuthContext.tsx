// import { createContext, ReactNode, useEffect } from 'react'
// import { useAuthCheck } from '../hooks/useAuth'
// import { updateGlobalAuthState } from '../utils/authHelpers'
// import { setCurrentAuthUser } from '../store/useUserStore'

// interface AuthUser {
//   username: string
// }

// export interface AuthContextType {
//   isAuthenticated: boolean | null
//   authUser: AuthUser | null
//   isLoading: boolean
//   username: string | null
// }

// export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// interface AuthProviderProps {
//   children: ReactNode
// }

// export function AuthProvider({ children }: AuthProviderProps) {
//   const authData = useAuthCheck()

//   useEffect(() => {
//     updateGlobalAuthState({
//       username: authData.username,
//       isAuthenticated: authData.isAuthenticated,
//       theme: authData.theme
//     })
    
//     // Update the user store with auth data
//     if (authData.authUser) {
//       setCurrentAuthUser(authData.authUser)
//     } else {
//       setCurrentAuthUser(null)
//     }
//   }, [authData.username, authData.isAuthenticated, authData.authUser])

//   return (
//     <AuthContext.Provider value={authData}>
//       {children}
//     </AuthContext.Provider>
//   )
// }


// src/context/AuthContext.tsx

import { createContext, ReactNode, useEffect } from 'react'
import { useAuthCheck } from '../hooks/useAuth'
import { updateGlobalAuthState } from '../utils/authHelpers'
import { setCurrentAuthUser } from '../store/useUserStore'

interface AuthUser {
  username: string
}

export interface AuthContextType {
  isAuthenticated: boolean | null
  authUser: AuthUser | null
  isLoading: boolean
  username: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authData = useAuthCheck()

  useEffect(() => {
    updateGlobalAuthState({
      username: authData.username,
      isAuthenticated: authData.isAuthenticated,
    })

    if (authData.authUser) {
      setCurrentAuthUser(authData.authUser)
    } else {
      setCurrentAuthUser(null)
    }
  }, [authData.username, authData.isAuthenticated, authData.authUser])

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider }
