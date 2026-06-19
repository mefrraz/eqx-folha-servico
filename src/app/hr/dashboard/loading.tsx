export default function HRDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card h-16" />
        ))}
      </div>
    </div>
  );
}
