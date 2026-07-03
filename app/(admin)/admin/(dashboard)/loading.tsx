export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse font-sans">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-800 rounded" />
          <div className="h-8 w-64 bg-gray-800 rounded" />
          <div className="h-3 w-96 bg-gray-800/60 rounded" />
        </div>
        <div className="h-9 w-36 bg-gray-800 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-gray-800 bg-[#1A1A1A] space-y-3"
          >
            <div className="h-3 w-20 bg-gray-800 rounded" />
            <div className="h-7 w-28 bg-gray-800 rounded" />
            <div className="h-2 w-16 bg-gray-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* Table / content area skeleton */}
      <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] overflow-hidden">
        {/* Table header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-800 rounded" />
          <div className="h-8 w-28 bg-gray-800 rounded-lg" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 border-b border-gray-800/40 last:border-0"
          >
            <div className="h-9 w-9 bg-gray-800 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 bg-gray-800 rounded" />
              <div className="h-2.5 w-24 bg-gray-800/60 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-800 rounded-full" />
            <div className="h-7 w-14 bg-gray-800 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
