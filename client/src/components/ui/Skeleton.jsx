export const SkeletonCard = () => (
  <div className="card p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-4 w-24" />
    </div>
    <div className="skeleton h-6 w-3/4 mb-2" />
    <div className="skeleton h-4 w-full mb-1" />
    <div className="skeleton h-4 w-2/3 mb-5" />
    <div className="flex items-center gap-4">
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-4 w-28" />
    </div>
    <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-8 w-28 rounded-xl" />
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2 animate-pulse">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="skeleton h-4"
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      />
    ))}
  </div>
);

export const SkeletonDetailPage = () => (
  <div className="animate-pulse">
    <div className="skeleton h-8 w-1/2 mb-3" />
    <div className="flex gap-3 mb-6">
      <div className="skeleton h-6 w-20 rounded-full" />
      <div className="skeleton h-6 w-32" />
    </div>
    <SkeletonText lines={4} />
    <div className="mt-8">
      <div className="skeleton h-6 w-40 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 mb-3 animate-pulse">
          <div className="skeleton h-5 w-1/2 mb-2" />
          <div className="skeleton h-4 w-full mb-1" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);
