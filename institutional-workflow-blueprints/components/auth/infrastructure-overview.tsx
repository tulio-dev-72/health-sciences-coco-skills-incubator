export function InfrastructureOverview({ compact = false }: { compact?: boolean }) {
  const layers = [
    { label: "Workflow Layer", detail: "Settlement governance and authorization orchestration" },
    {
      label: "Fireblocks MPC Custody + Signing",
      detail: "MPC-secured custody, signing, and transaction orchestration",
    },
    {
      label: "Blockchain Settlement Rails",
      detail: "On-chain broadcast and confirmation after authorization",
    },
  ];

  return (
    <section className={compact ? "" : "rounded-lg border border-ops-border-subtle bg-ops-surface/80 px-4 py-3"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ops-text-dim">
        Infrastructure overview
      </p>
      <div className="mt-3 space-y-2">
        {layers.map((layer, index) => (
          <div key={layer.label}>
            <div className="rounded-md border border-ops-border-subtle bg-ops-overlay/40 px-3 py-2">
              <p className="text-[11px] font-medium text-ops-text">{layer.label}</p>
              {!compact ? (
                <p className="mt-0.5 text-[10px] text-ops-text-secondary">{layer.detail}</p>
              ) : null}
            </div>
            {index < layers.length - 1 ? (
              <p className="py-1 text-center text-[10px] text-ops-text-dim">↓</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
