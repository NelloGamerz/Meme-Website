import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";

export const LoginForm: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate("/");
    } catch (err) {
    }
  };

  return (
    <div className="light">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          icon={User}
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
          error={error?.username}
        />
        <Input
          icon={Lock}
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          error={error?.password}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center text-gray-600">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData({ ...formData, rememberMe: e.target.checked })
              }
              className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Remember me
          </label>
          <a
            href="/forgot-password"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full text-[#ffffff]"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>
    </div>
  );
};
