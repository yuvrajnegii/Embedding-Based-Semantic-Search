function SkeletonCard({ index }) {
  return (
    <div
      className="card card-hover animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-8 bg-slate-100 dark:bg-gray-600 rounded"></div>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="h-3 w-full bg-slate-100 dark:bg-gray-600 rounded mb-1.5"></div>
      <div className="h-3 w-5/6 bg-slate-100 dark:bg-gray-600 rounded mb-1.5"></div>
      <div className="h-3 w-2/3 bg-slate-100 dark:bg-gray-600 rounded mb-3"></div>
      <div className="h-2.5 w-1/4 bg-slate-100 dark:bg-gray-700 rounded"></div>
    </div>
  );
}

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div aria-label="Loading results" role="status">
      <span className="sr-only">Loading results...</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}
