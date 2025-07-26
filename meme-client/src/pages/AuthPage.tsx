import React, { useEffect, useState } from "react";
import { AuthTabs } from "../components/auth/AuthTabs";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { toast } from "react-hot-toast";
import { getCurrentTheme } from "../utils/authHelpers";

export const AuthPage: React.FC = () => {
  useEffect(() => {
    if (localStorage.getItem("sessionExpired")) {
      toast.error("Session Expired! Please log in again.");
      localStorage.removeItem("sessionExpired");
    }
  }, []);

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

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="light">
      <div className="bg-white min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                {activeTab === "login" ? "Welcome Back" : "Create Account"}
              </h2>

              {activeTab === "login" ? <LoginForm /> : <RegisterForm />}

              <div className="mt-6 text-center text-sm text-gray-600">
                {activeTab === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setActiveTab("register")}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Register here
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("login")}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
