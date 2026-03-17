export default function CartLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-800" />
        <p className="text-sm text-slate-600">Loading cart items...</p>
      </div>
    </div>
  );
}
