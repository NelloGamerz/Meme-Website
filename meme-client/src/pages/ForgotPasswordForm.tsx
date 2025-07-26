"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { getCurrentTheme } from "../utils/authHelpers";

export const ForgotPasswordForm: React.FC = () => {
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

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(
        `Failed to send reset link. ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/auth");
  };

  return (
    <div className="light">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your
              password
            </p>
          </div>

          {isSubmitted ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Reset link sent
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      We've sent a password reset link to {email}. Please check
                      your inbox and follow the instructions.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={goToLogin}
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className={`block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ${
                      error
                        ? "ring-red-300 placeholder:text-red-300 focus:ring-red-500"
                        : "ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600"
                    } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {error}
                  </p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full text-[#ffffff]"
                  isLoading={isLoading}
                >
                  Send reset link
                </Button>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={goToLogin}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
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
  );
};
