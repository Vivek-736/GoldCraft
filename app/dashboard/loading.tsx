export default function DashboardLoading() {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-100 border-t-amber-800" />
          <div className="absolute inset-0 animate-pulse rounded-full bg-amber-800/10" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-serif font-semibold text-slate-900">GoldCraft Dashboard</h3>
          <p className="text-sm text-slate-500 animate-pulse">Loading your personalized experience...</p>
        </div>
      </div>
    </div>
  );
}