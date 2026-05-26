export default function SettingsLoading() {
  return (
    <div>
      <div className="h-14 border-b border-gray-100 bg-white flex items-center px-6">
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="p-6 max-w-2xl space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-9 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}
          <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
