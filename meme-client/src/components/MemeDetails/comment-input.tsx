import type React from "react"

import { Send } from "lucide-react"

interface CommentInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  placeholder?: string
  className?: string
}

export function CommentInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Add a comment...",
  className = "",
}: CommentInputProps) {
  return (
    <form onSubmit={onSubmit} className={`flex space-x-3 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border border-white/30 bg-white/40 backdrop-blur-sm rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder-slate-500"
      />

      <button
        type="submit"
        disabled={!value.trim()}
        className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
