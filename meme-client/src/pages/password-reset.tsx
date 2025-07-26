import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Lock, Check, X, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { getCurrentTheme } from "../utils/authHelpers"

const PasswordResetPage: React.FC = () => {
  useEffect(() => {
    const originalTheme = getCurrentTheme();
    
    // Force light theme for auth pages without updating global context
    document.documentElement.classList.remove("dark", "system");
    document.documentElement.classList.add("light");
    
    return () => {
      // Restore original theme classes without updating global context
      if (originalTheme) {
        document.documentElement.classList.remove("light", "dark", "system");
        document.documentElement.classList.add(originalTheme);
      }
    };
  }, []);

  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState("")

  const { resetPassword } = useAuth()

  const [validations, setValidations] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false,
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const resetToken = params.get("token")
    if (resetToken) {
      setToken(resetToken)
    } else {
      const pathToken = location.pathname.split("/").pop()
      if (pathToken && pathToken !== "reset-password") {
        setToken(pathToken)
      }
    }
  }, [location])

  useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
      passwordsMatch: password === confirmPassword && password !== "",
    })
  }, [password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!Object.values(validations).every(Boolean)) {
      setError("Password does not meet all requirements")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await resetPassword(password, token)
      setIsSubmitted(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Please try again."
      setError(`${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const goToLogin = () => {
    navigate("/auth")
  }

  return (
    <div className="light">
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">Create a new password for your account</p>
        </div>
        <div className="mt-8">
          {isSubmitted ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <Check className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Password reset successful</h3>
                  <p className="mt-2 text-sm text-green-700">
                    Your password has been reset successfully. You can now log in with your new password.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    onClick={goToLogin}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go to login
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-100 p-4">
                  <h4 className="text-sm-black font-medium text-gray-700 mb-2">Password must:</h4>
                  <ul className="space-y-1">
                    {[
                      { check: validations.minLength, text: "Be at least 8 characters long" },
                      { check: validations.hasLetter, text: "Contain at least one letter" },
                      { check: validations.hasNumber, text: "Contain at least one number" },
                      { check: validations.hasSpecial, text: "Contain at least one special character" },
                      { check: validations.passwordsMatch, text: "Passwords match" },
                    ].map((item, index) => (
                      <li key={index} className="flex items-center text-sm">
                        {item.check ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <X className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  className={`flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-[#ffffff] shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    isLoading || !Object.values(validations).every(Boolean)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isLoading || !Object.values(validations).every(Boolean)}
                >
                  {isLoading && (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={goToLogin}
                  className="flex w-full items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

export default PasswordResetPage