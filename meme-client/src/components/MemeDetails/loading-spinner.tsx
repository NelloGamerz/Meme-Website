export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
        <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
      </div>
      <p className="text-slate-600 text-sm mt-4 font-medium">Loading amazing content...</p>
    </div>
  )
}
