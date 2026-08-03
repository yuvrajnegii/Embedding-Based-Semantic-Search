function SkeletonCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-2.5 animate-pulse">
      <div className="h-4 w-1/3 bg-neutral-200 rounded mb-3"></div>
      <div className="h-1 w-full bg-neutral-100 rounded mb-3"></div>
      <div className="h-3 w-full bg-neutral-100 rounded mb-1.5"></div>
      <div className="h-3 w-5/6 bg-neutral-100 rounded mb-1.5"></div>
      <div className="h-3 w-2/3 bg-neutral-100 rounded mb-3"></div>
      <div className="h-2.5 w-1/4 bg-neutral-100 rounded"></div>
    </div>
  );
}

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
