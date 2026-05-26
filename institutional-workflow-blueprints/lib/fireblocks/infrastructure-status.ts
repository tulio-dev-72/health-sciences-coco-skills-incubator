import { SETTLEMENT_RAIL_SEPOLIA } from "@/lib/fireblocks/constants";
import type { TreasuryMainFundingStatus } from "@/lib/fireblocks/funding-types";
import type { FireblocksIntegrationStatus } from "@/lib/fireblocks/types";

export type InfrastructureStatusItem = {
  id: string;
  label: string;
  active: boolean;
  detail: string;
};

export type WebhookStreamSummary = {
  total: number;
  processed: number;
  failed: number;
  ignored: number;
} | null;

export function buildInfrastructureStatus(input: {
  integrationStatus: FireblocksIntegrationStatus;
  fundingStatus: TreasuryMainFundingStatus | null;
  ethAvailable: number | null;
  webhookEndpointActive: boolean;
  webhookStream?: WebhookStreamSummary;
}): InfrastructureStatusItem[] {
  const connected = input.integrationStatus === "connected";
  const funded =
    input.fundingStatus === "ready" ||
    (input.ethAvailable !== null && input.ethAvailable > 0);
  const gasAvailable = input.ethAvailable !== null && input.ethAvailable > 0;
  const webhookStreamHealthy =
    input.webhookEndpointActive &&
    (!input.webhookStream ||
      input.webhookStream.total === 0 ||
      input.webhookStream.failed === 0);
  const mpcOperational = connected && funded;
  const sepoliaRailOperational = connected && gasAvailable;

  return [
    {
      id: "fireblocks-connected",
      label: "Fireblocks Connection",
      active: connected,
      detail: connected
        ? "Server-side SDK is connected to the Fireblocks sandbox."
        : "Configure Fireblocks credentials to enable live vault discovery.",
    },
    {
      id: "treasury-main-funded",
      label: "Treasury Main Funding Status",
      active: connected && funded,
      detail:
        connected && funded
          ? "Treasury Main holds Sepolia test ETH for settlement authorization."
          : "Treasury Main balance is zero — fund via external Sepolia faucet.",
    },
    {
      id: "webhook-stream-status",
      label: "Webhook Stream Status",
      active: webhookStreamHealthy,
      detail: !input.webhookEndpointActive
        ? "Webhook endpoint is unavailable or not configured."
        : input.webhookStream && input.webhookStream.total > 0
          ? `${input.webhookStream.processed}/${input.webhookStream.total} events processed${
              input.webhookStream.failed > 0
                ? ` · ${input.webhookStream.failed} failed`
                : ""
            }`
          : "POST /api/webhooks/fireblocks registered — awaiting custody lifecycle events.",
    },
    {
      id: "mpc-custody-layer",
      label: "MPC Custody Layer Status",
      active: mpcOperational,
      detail: mpcOperational
        ? "MPC-secured vault custody and TAP policy enforcement are operational."
        : connected
          ? "Custody layer online — Treasury Main requires funding before signing."
          : "MPC custody unavailable until Fireblocks integration is connected.",
    },
    {
      id: "ethereum-sepolia-rail",
      label: "Ethereum Sepolia Rail Status",
      active: sepoliaRailOperational,
      detail: sepoliaRailOperational
        ? `${SETTLEMENT_RAIL_SEPOLIA} testnet rail ready for governed settlement release.`
        : connected
          ? `${SETTLEMENT_RAIL_SEPOLIA} rail degraded — no Sepolia ETH available for gas.`
          : `${SETTLEMENT_RAIL_SEPOLIA} rail unavailable — custody integration offline.`,
    },
  ];
}
