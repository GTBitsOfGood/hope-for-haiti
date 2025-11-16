export default function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Metric Group Skeleton - regular grid item like other widgets */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 pb-20 rounded-lg border border-blue-200 bg-white"
          >
            <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-8 w-32 bg-gray-300 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[5.227px] border border-blue-200 bg-white px-[26px] py-5"
        >
          <div className="h-5 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div
                  className="h-6 bg-gray-200 rounded animate-pulse"
                  style={{ width: `${Math.random() * 60 + 30}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-[5.227px] border border-blue-200 bg-white px-[26px] py-5"
        >
          <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
          </div>
          <div className="mt-4 text-center">
            <div className="h-6 w-24 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>
        </div>
      ))}

      <div className="rounded-[5.227px] border border-blue-200 bg-white px-[26px] py-5">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gray-200 animate-pulse" />
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[5.227px] border border-blue-200 bg-white px-[26px] py-5">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="flex items-end justify-between h-48 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-t animate-pulse"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
