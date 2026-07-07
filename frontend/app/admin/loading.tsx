function SkeletonCard() {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
      <div className="h-3 w-24 rounded-full bg-slate-800" />
      <div className="mt-4 h-8 w-32 rounded-full bg-slate-800" />
      <div className="mt-3 h-3 w-full rounded-full bg-slate-900" />
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div className="h-3 w-32 rounded-full bg-cyan-300/20" />
        <div className="mt-5 h-10 w-full max-w-xl rounded-full bg-slate-800" />
        <div className="mt-4 h-4 w-full max-w-3xl rounded-full bg-slate-900" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div className="h-4 w-40 rounded-full bg-slate-800" />
        <div className="mt-5 grid gap-3">
          <div className="h-12 rounded-md bg-slate-900" />
          <div className="h-12 rounded-md bg-slate-900" />
          <div className="h-12 rounded-md bg-slate-900" />
        </div>
      </div>
    </div>
  );
}
