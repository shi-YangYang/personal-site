export default function BlogPostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 animate-pulse">
      <div className="h-4 w-24 bg-bg-elevated rounded mb-8" />
      <div className="h-3 w-44 bg-bg-elevated rounded mb-4" />
      <div className="h-10 w-3/4 bg-bg-elevated rounded mb-3" />
      <div className="h-4 w-2/3 bg-bg-elevated rounded mb-10" />

      <div className="h-28 w-full bg-bg-elevated rounded-xl border border-brand-primary/20 mb-10">
        <div className="h-4 w-16 bg-bg-base/60 rounded m-5" />
        <div className="space-y-2.5 mx-5">
          <div className="h-3 w-2/3 bg-bg-base/60 rounded" />
          <div className="h-3 w-1/2 bg-bg-base/60 rounded" />
          <div className="h-3 w-3/5 bg-bg-base/60 rounded" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-3 w-full bg-bg-elevated rounded" />
        <div className="h-3 w-full bg-bg-elevated rounded" />
        <div className="h-3 w-11/12 bg-bg-elevated rounded" />
        <div className="h-3 w-full bg-bg-elevated rounded" />
        <div className="h-3 w-4/5 bg-bg-elevated rounded" />
      </div>
    </div>
  );
}
