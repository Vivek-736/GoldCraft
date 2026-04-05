export default function DashboardAIDesignStudioLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-amber-100 border-t-amber-600" />
        <div className="h-6 w-6 text-amber-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </div>
      </div>
      <p className="mt-5 text-sm font-medium text-slate-600">Loading your designs...</p>
    </div>
  );
}