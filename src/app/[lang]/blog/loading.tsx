export default function BlogIndexLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 animate-pulse">
      <div className="h-4 w-20 bg-bg-elevated rounded mb-3" />
      <div className="h-10 w-40 bg-bg-elevated rounded mb-3" />
      <div className="h-4 w-72 bg-bg-elevated rounded mb-12" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-6 h-44 border-brand-primary/20"
          >
            <div className="h-3 w-24 bg-bg-elevated rounded mb-4" />
            <div className="h-5 w-3/4 bg-bg-elevated rounded mb-3" />
            <div className="h-3 w-full bg-bg-elevated rounded mb-2" />
            <div className="h-3 w-5/6 bg-bg-elevated rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
