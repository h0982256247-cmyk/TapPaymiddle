export default function MerchantDetailLoading() {
  return (
    <div>
      {/* Topbar skeleton */}
      <div className="h-14 border-b border-gray-100 bg-white flex items-center px-6">
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="p-6 space-y-4 max-w-5xl">
        {/* Back link skeleton */}
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />

        {/* Header card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-3.5 w-36 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" />
          </div>
        </div>

        {/* Info cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3.5 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
