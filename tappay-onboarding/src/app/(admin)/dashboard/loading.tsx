export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-3.5 w-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Cards row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-3.5 w-20 bg-gray-100 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
