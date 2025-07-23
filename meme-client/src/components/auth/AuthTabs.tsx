import React from "react";
import { Button } from "../ui/Button";

interface AuthTabsProps {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="light">
      <div className="flex">
        <Button
          variant={activeTab === "login" ? "primary" : "outline"}
          className="flex-1 rounded-none border-b-2 border-gray-200"
          onClick={() => onTabChange("login")}
        >
          Sign In
        </Button>
        <Button
          variant={activeTab === "register" ? "primary" : "outline"}
          className="flex-1 rounded-none border-b-2 border-gray-200"
          onClick={() => onTabChange("register")}
        >
          Register
        </Button>
      </div>
    </div>
  );
};
