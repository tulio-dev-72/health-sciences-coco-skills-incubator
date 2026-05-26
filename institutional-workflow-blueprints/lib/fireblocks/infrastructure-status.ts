import type { TreasuryMainFundingStatus } from "@/lib/fireblocks/funding-types";
import type { FireblocksIntegrationStatus } from "@/lib/fireblocks/types";

export type InfrastructureStatusItem = {
  id: string;
  label: string;
  active: boolean;
  detail: string;
};

export function buildInfrastructureStatus(input: {
  integrationStatus: FireblocksIntegrationStatus;
  fundingStatus: TreasuryMainFundingStatus | null;
  ethAvailable: number | null;
  webhookEndpointActive: boolean;
}): InfrastructureStatusItem[] {
  const connected = input.integrationStatus === "connected";
  const funded =
    input.fundingStatus === "ready" ||
    (input.ethAvailable !== null && input.ethAvailable > 0);
  const gasAvailable = input.ethAvailable !== null && input.ethAvailable > 0;

  return [
    {
      id: "fireblocks-connected",
      label: "Fireblocks Connected",
      active: connected,
      detail: connected
        ? "Server-side SDK is connected to the Fireblocks sandbox."
        : "Configure Fireblocks credentials to enable live vault discovery.",
    },
    {
      id: "treasury-main-funded",
      label: "Treasury Main Funded",
      active: connected && funded,
      detail:
        connected && funded
          ? "Treasury Main holds Sepolia test ETH for settlement authorization."
          : "Treasury Main balance is zero — fund via external Sepolia faucet.",
    },
    {
      id: "eth-gas-available",
      label: "ETH Gas Available",
      active: connected && gasAvailable,
      detail:
        connected && gasAvailable
          ? "Sepolia ETH is available for gas and outbound test settlements."
          : "No Sepolia ETH available in Treasury Main.",
    },
    {
      id: "webhook-endpoint-active",
      label: "Webhook Endpoint Active",
      active: input.webhookEndpointActive,
      detail: input.webhookEndpointActive
        ? "POST /api/webhooks/fireblocks is registered for custody lifecycle events."
        : "Webhook endpoint is unavailable or not configured.",
    },
  ];
}
