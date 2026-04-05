export default function AIDesignStudioLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FDFCFB]">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-amber-100 border-t-amber-600" />
        <div className="absolute inset-2 animate-[spin_2s_linear_infinite_reverse] rounded-full border-2 border-slate-100 border-t-slate-400" />
        <div className="h-8 w-8 animate-pulse text-amber-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </div>
      </div>
      <h3 className="mt-8 font-serif text-xl font-medium text-slate-900">Entering Design Studio</h3>
      <p className="mt-2 text-sm font-medium uppercase tracking-widest text-[#D4A95A]">
        Initializing AI Engine
      </p>
    </div>
  );
}