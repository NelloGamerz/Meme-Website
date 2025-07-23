import React from "react"
import { Mail, Lock, User } from "lucide-react"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { useAuth } from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom"

export const RegisterForm: React.FC = () => {
  const { register, isLoading, error } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
  })


  const [usernameStatus, setUsernameStatus] = React.useState<"checking" | "available" | "taken" | null>(null)
  const [emailValid, setEmailValid] = React.useState<boolean | null>(null)

  const usernameToCheck = React.useRef("")

  const usernameTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value
    setFormData({ ...formData, username: newUsername })

    usernameToCheck.current = newUsername

    if (newUsername.length < 3) {
      setUsernameStatus(null)
    } else {
      if (usernameStatus !== "checking") {
        setUsernameStatus("checking")
      }

      debouncedCheckUsername()
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setFormData({ ...formData, email: newEmail })

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!newEmail) {
      setEmailValid(null)
    } else if (emailRegex.test(newEmail)) {
      setEmailValid(true)
    } else {
      setEmailValid(false)
    }
  }

  const debouncedCheckUsername = React.useCallback(() => {
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current)
    }

    usernameTimeoutRef.current = setTimeout(() => {
      const username = usernameToCheck.current

      const API_URL = import.meta.env.VITE_API_URL;
      const API_BASE_URL = `${API_URL}auth/check-username?username=${encodeURIComponent(username)}`;

      if (username.length >= 3) {
        fetch(
          API_BASE_URL,
          {
            credentials: "include",
          },
        )
          .then((response) => response.json())
          .then((data) => {
            setUsernameStatus(data.available ? "available" : "taken")
          })
          .catch(() => {
            setUsernameStatus(null)
          })
      }
    }, 500)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await register(formData)
    navigate("/")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        icon={User}
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.username}
        onChange={handleUsernameChange}
        required
        error={error?.name}
        rightElement={
          usernameStatus === "checking" ? (
            <span className="text-gray-400 text-sm animate-pulse">Checking...</span>
          ) : usernameStatus === "available" ? (
            <span className="text-green-500 text-sm">Available</span>
          ) : usernameStatus === "taken" ? (
            <span className="text-red-500 text-sm">Already taken</span>
          ) : null
        }
      />
      <Input
        icon={Mail}
        type="email"
        name="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={handleEmailChange}
        required
        error={error?.email}
        rightElement={
          emailValid === false && formData.email.length > 0 ? (
            <span className="text-yellow-500 text-sm">Invalid format</span>
          ) : emailValid === true ? (
            <span className="text-green-500 text-sm">Valid format</span>
          ) : null
        }
      />
      <Input
        icon={Lock}
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        error={error?.password}
      />

      <Button type="submit" className="w-full text-[#ffffff]" isLoading={isLoading}>
        Create Account
      </Button>
    </form>
  )
}
