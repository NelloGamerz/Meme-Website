import { Eye } from "lucide-react"

interface NotFoundProps {
  onBack: () => void
}

export function NotFound({ onBack }: NotFoundProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Eye className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-xl font-semibold text-slate-800 mb-2">Content not found</p>
        <p className="text-slate-600 mb-6">This pin might have been removed or doesn't exist.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
