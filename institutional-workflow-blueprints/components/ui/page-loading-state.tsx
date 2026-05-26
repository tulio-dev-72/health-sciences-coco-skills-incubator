export function PageLoadingState({
  label = "Loading operational workspace…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ops-bg text-ops-text">
      <div className="text-center">
        <div
          className="mx-auto h-8 w-36 animate-pulse rounded-lg bg-ops-overlay"
          aria-hidden
        />
        <p className="mt-3 text-xs text-ops-text-dim">{label}</p>
      </div>
    </div>
  );
}
