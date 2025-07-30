import { useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { useUserStore } from "../store/useUserStore"
import { useWebSocketConnectionStore } from "../store/useWebSocketConnectionStore"
import { useAuthStore } from "../store/useAuthStore"

interface LoginData {
  username: string
  password: string
  rememberMe?: boolean
}

interface RegisterData {
  username: string
  email: string
  password: string
}

interface AuthError {
  username?: string
  email?: string
  password?: string
  name?: string
  message?: string
}

export const API_URL =
  import.meta.env.VITE_API_URL;

export const useAuthCheck = () => {
  const user = useAuthStore.use.user()
  const isAuthenticated = useAuthStore.use.isAuthenticated()
  const isLoading = useAuthStore.use.isLoading()
  const isInitialized = useAuthStore.use.isInitialized()
  const initialize = useAuthStore.use.initialize()
  const checkAuth = useAuthStore.use.checkAuth()

  useEffect(() => {
    initialize()

    const handleAuthStateChange = () => {

    }

    window.addEventListener('auth-state-changed', handleAuthStateChange)
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange)
    }
  }, [initialize])

  return { 
    isAuthenticated, 
    authUser: user, 
    isLoading: isLoading || !isInitialized,
    username: user?.username || null,
    theme: user?.theme || 'light',
    refreshAuth: checkAuth
  }
}

const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const setUser = useAuthStore.use.setUser()
  const setAuthenticated = useAuthStore.use.setAuthenticated()

  const login = async (data: LoginData) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await axios.post(`${API_URL}auth/login`, data, {
        withCredentials: true,
      })

      toast.success("Successfully logged in!")
      
      const userData = {
        username: response.data.username,
        email: response.data.email,
        profilePicture: response.data.profilePicture,
        name: response.data.name,
      };
      
      setUser(userData);
      setAuthenticated(true);
      
      const { handleAuthStateChange } = useUserStore.getState() as {
        handleAuthStateChange: (authUser: { userId: string; username: string } | null) => Promise<void>;
      };
      await handleAuthStateChange({
        userId: response.data.userId,
        username: response.data.username
      });
      
      const { connectWebSocket } = useWebSocketConnectionStore.getState() as {
        connectWebSocket: () => void;
      };
      connectWebSocket();
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { user: userData, isAuthenticated: true }
      }));
      
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.errors || { message: "Login failed" })
        toast.error(err.response.data.message || "Invalid username or password")
      } else {
        setError({ message: "An unexpected error occurred" })
        toast.error("An unexpected error occurred")
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.post(`${API_URL}auth/register`, data)

      toast.success("Successfully registered!")
      
      // Update the auth store with user data
      const userData = {
        userId: response.data.userId,
        username: response.data.username,
        email: response.data.email,
        profilePicture: response.data.profilePicture,
        name: response.data.name,
      };
      
      setUser(userData);
      setAuthenticated(true);
      
      // Update the user store with auth data and fetch profile
      const { handleAuthStateChange } = useUserStore.getState() as {
        handleAuthStateChange: (authUser: { userId: string; username: string } | null) => Promise<void>;
      };
      await handleAuthStateChange({
        userId: response.data.userId,
        username: response.data.username
      });
      
      const { connectWebSocket } = useWebSocketConnectionStore.getState() as {
        connectWebSocket: () => void;
      };
      connectWebSocket();
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { user: userData, isAuthenticated: true }
      }));
      
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data
        const errorMessage = errorData.username || errorData.message || "Registration failed"

        setError({ message: errorMessage })
        toast.error(errorMessage)
      } else {
        setError({ message: "An unexpected error occurred" })
        toast.error("An unexpected error occurred")
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.post(`${API_URL}auth/forgot-password`, { email })

      toast.success("Password reset link sent to your email!")
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data
        const errorMessage = errorData.message || "Failed to send reset link"

        setError({ message: errorMessage })
        toast.error(errorMessage)
      } else {
        setError({ message: "An unexpected error occurred" })
        toast.error("An unexpected error occurred")
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (password: string, resetId: string) => {
    if (!resetId) {
      throw new Error("Invalid or expired token")
    }

    try {
      const response = await axios.post(`${API_URL}auth/reset-password`, {
        resetId,
        newPassword: password,
      })

      return response.data
    } catch (error) {
      const errorMessage = "Failed to reset password"
      throw new Error(errorMessage)
    }
  }

  const checkUsernameAvailability = () => { }

  const logout = async () => {
    try {
      await axios.post(`${API_URL}auth/logout`, {}, {
        withCredentials: true,
      })

      // Clear auth store
      setUser(null);
      setAuthenticated(false);
      
      // Clear auth user from user store
      const { handleAuthStateChange } = useUserStore.getState() as {
        handleAuthStateChange: (authUser: { userId: string; username: string } | null) => Promise<void>;
      };
      await handleAuthStateChange(null);
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { user: null, isAuthenticated: false }
      }));
      
      const { disconnectWebSocket } = useWebSocketConnectionStore.getState() as {
        disconnectWebSocket: () => void;
      };
      disconnectWebSocket();
      
      useUserStore.setState({
        loggedInUserProfile: null,
        isLoggedInUserProfileLoaded: false,
        loggedInUserProfilePictureUrl: "",
        loggedInUserName: "",
        loggedInUserFollowers: [],
        loggedInUserFollowing: [],
        loggedInUserFollowersCount: 0,
        loggedInUserFollowingCount: 0,
      });
      toast.success("Successfully logged out!")
    } catch (error) {
      toast.error("Failed to log out. Please try again.")
    }
  }

  return {
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    checkUsernameAvailability,
    isLoading,
    error,
  }
}

export { useAuth }