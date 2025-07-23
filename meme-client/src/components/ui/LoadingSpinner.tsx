export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-600"></div>
        <div className="absolute inset-0 rounded-full h-10 w-10 border-4 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
      </div>
      <p className="text-slate-600 text-sm mt-3 font-medium">Loading more memes...</p>
    </div>
  )
}