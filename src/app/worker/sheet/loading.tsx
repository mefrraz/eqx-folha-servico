export default function SheetLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded-lg" />
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <div className="h-10 w-36 bg-gray-200 rounded-lg" />
        <div className="h-10 w-36 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
