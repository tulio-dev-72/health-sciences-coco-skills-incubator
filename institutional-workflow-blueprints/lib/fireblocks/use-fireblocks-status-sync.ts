"use client";

import { useEffect } from "react";
import { fetchFireblocksTransferStatus } from "@/lib/fireblocks/api-client";
import { useAppStore } from "@/lib/store";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "REJECTED", "CANCELLED", "BLOCKED"]);

export function useFireblocksStatusSync() {
  const { state, syncFireblocksTransferStatus } = useAppStore();

  useEffect(() => {
    if (!state.fireblocksEnabled) {
      return;
    }

    const tracked = state.transfers.filter(
      (transfer) => transfer.fireblocksTxId || transfer.status === "SETTLED",
    );

    if (tracked.length === 0) {
      return;
    }

    let cancelled = false;

    async function syncStatuses() {
      for (const transfer of tracked) {
        if (transfer.fireblocksStatus && TERMINAL_STATUSES.has(transfer.fireblocksStatus)) {
          continue;
        }

        try {
          const status = await fetchFireblocksTransferStatus({
            externalTxId: transfer.id,
            fireblocksTxId: transfer.fireblocksTxId,
          });

          if (cancelled) {
            return;
          }

          syncFireblocksTransferStatus({
            externalTxId: transfer.id,
            fireblocksTxId: status.fireblocksTxId,
            status: status.status,
            subStatus: status.subStatus,
          });
        } catch {
          // Ignore missing records until submit/webhook arrives.
        }
      }
    }

    void syncStatuses();
    const interval = window.setInterval(syncStatuses, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [state.fireblocksEnabled, state.transfers, syncFireblocksTransferStatus]);
}
