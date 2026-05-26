export default function NotifyLogsLoading() {
  return (
    <div>
      <div className="h-14 border-b border-gray-100 bg-white flex items-center px-6">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="w-1 h-1 rounded-full bg-gray-200 mx-3" />
        <div className="h-3.5 w-12 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
          <div className="bg-gray-50/80 px-5 py-3 flex gap-8 border-b border-gray-100">
            {[48, 72, 64, 80, 64].map((w, i) => (
              <div key={i} className="h-3 rounded bg-gray-200 animate-pulse" style={{ width: w }} />
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-20 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
