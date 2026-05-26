export default function MerchantsLoading() {
  return (
    <div>
      {/* Topbar skeleton */}
      <div className="h-14 border-b border-gray-100 bg-white flex items-center px-6">
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="w-1 h-1 rounded-full bg-gray-200 mx-3" />
        <div className="h-3.5 w-10 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="p-6 space-y-4">
        {/* Pill tabs skeleton */}
        <div className="flex gap-1.5">
          {[60, 56, 56, 64, 56, 64, 80, 56, 44].map((w, i) => (
            <div key={i} className="h-7 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
          <div className="bg-gray-50/80 px-5 py-3 flex gap-8 border-b border-gray-100">
            {[80, 48, 72, 56, 72].map((w, i) => (
              <div key={i} className="h-3 rounded bg-gray-200 animate-pulse" style={{ width: w }} />
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-36 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-3.5 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
