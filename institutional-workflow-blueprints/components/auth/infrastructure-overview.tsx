type LayerStatusTone = "success" | "info" | "neutral";

type ArchitectureLayer = {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
  status: { label: string; tone: LayerStatusTone };
  icon: React.ReactNode;
};

const statusToneStyles: Record<LayerStatusTone, string> = {
  success: "bg-ops-success-muted text-ops-success ring-1 ring-ops-success/20",
  info: "bg-ops-info-muted text-ops-info ring-1 ring-ops-info/20",
  neutral: "bg-ops-primary-muted text-ops-primary ring-1 ring-ops-primary/15",
};

function LayerStatusBadge({ label, tone }: { label: string; tone: LayerStatusTone }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusToneStyles[tone]}`}
    >
      {label}
    </span>
  );
}

function WorkflowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="10" width="18" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="16" width="18" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CustodyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M12 3 4 7v6c0 4.5 3.4 8.7 8 9 4.6-.3 8-4.5 8-9V7l-8-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5 11 14l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BlockchainIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.2 11 15.5 7M8.2 13l7.3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function buildLayers(fireblocksConnected: boolean): ArchitectureLayer[] {
  return [
    {
      id: "workflow",
      title: "Workflow Layer",
      description:
        "Role-based treasury workflow, policy evaluation, manager authorization, and audit visibility.",
      capabilities: [
        "Analyst initiation and settlement review",
        "Manager authorization queue with policy gates",
        "Immutable audit trail across workflow states",
      ],
      status: { label: "Operational", tone: "success" },
      icon: <WorkflowIcon />,
    },
    {
      id: "custody",
      title: "Fireblocks MPC Custody + Signing",
      description:
        "Vault Accounts hold assets. Fireblocks handles MPC-secured custody, transaction signing, TAP/co-signer policy, and SDK/API orchestration.",
      capabilities: [
        "MPC-secured vault accounts and asset custody",
        "TAP policy and co-signer authorization controls",
        "SDK/API transaction orchestration and signing",
      ],
      status: {
        label: fireblocksConnected ? "Connected" : "Sandbox Ready",
        tone: fireblocksConnected ? "success" : "info",
      },
      icon: <CustodyIcon />,
    },
    {
      id: "settlement",
      title: "Blockchain Settlement Rails",
      description:
        "Ethereum Sepolia testnet provides the settlement rail for ETH/USDC test assets and transaction confirmation.",
      capabilities: [
        "Sepolia testnet broadcast and confirmation",
        "ETH and USDC test asset settlement",
        "On-chain receipt linked to workflow audit",
      ],
      status: { label: "Sepolia Testnet", tone: "info" },
      icon: <BlockchainIcon />,
    },
  ];
}

function LayerConnector() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <div className="flex flex-col items-center gap-0.5">
        <div className="h-2 w-px bg-ops-border" />
        <div className="text-[10px] font-semibold text-ops-text-secondary">↓</div>
        <div className="h-2 w-px bg-ops-border" />
      </div>
    </div>
  );
}

function ArchitectureLayerCard({ layer }: { layer: ArchitectureLayer }) {
  return (
    <article className="rounded-lg border border-ops-border bg-ops-surface px-4 py-3.5 shadow-[var(--ops-shadow-sm)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ops-border bg-ops-primary-muted text-ops-primary">
          {layer.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-ops-text">{layer.title}</h3>
            <LayerStatusBadge label={layer.status.label} tone={layer.status.tone} />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ops-text-secondary">{layer.description}</p>
          <ul className="mt-3 space-y-1.5">
            {layer.capabilities.map((capability) => (
              <li key={capability} className="flex gap-2 text-[11px] leading-snug text-ops-text">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ops-primary" aria-hidden />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function InfrastructureOverview({
  compact = false,
  fireblocksConnected = false,
}: {
  compact?: boolean;
  fireblocksConnected?: boolean;
}) {
  const layers = buildLayers(fireblocksConnected);

  return (
    <section
      className={
        compact
          ? "rounded-xl border border-ops-border bg-ops-surface p-4 shadow-[var(--ops-shadow-md)] sm:p-5"
          : "rounded-xl border border-ops-border bg-ops-surface p-5 shadow-[var(--ops-shadow-md)]"
      }
    >
      <div className="border-b border-ops-border pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ops-text-secondary">
          Architecture overview
        </p>
        <h2 className="mt-1 text-base font-semibold text-ops-text">
          Institutional settlement stack
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-ops-text-secondary">
          Three integrated layers from treasury workflow through MPC custody to on-chain settlement.
        </p>
      </div>

      <div className="mt-4 space-y-0">
        {layers.map((layer, index) => (
          <div key={layer.id}>
            <ArchitectureLayerCard layer={layer} />
            {index < layers.length - 1 ? <LayerConnector /> : null}
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-lg border border-ops-border bg-ops-overlay/60 px-3 py-2.5 text-[11px] leading-relaxed text-ops-text-secondary">
        <span className="font-semibold text-ops-text">End-to-end path:</span> settlement requests
        originate in the workflow layer, pass Fireblocks custody and signing controls, then settle on
        Sepolia with full audit linkage.
      </p>
    </section>
  );
}
