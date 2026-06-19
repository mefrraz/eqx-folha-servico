export default function WorkerDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="card animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
          <div className="h-10 w-44 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse h-20" />
        ))}
      </div>
    </div>
  );
}
