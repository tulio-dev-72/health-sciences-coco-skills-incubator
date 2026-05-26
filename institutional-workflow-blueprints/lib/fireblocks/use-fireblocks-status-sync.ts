"use client";

import { useEffect } from "react";
import { fetchFireblocksTransferStatus } from "@/lib/fireblocks/api-client";
import { isRealFireblocksTxId } from "@/lib/fireblocks/lifecycle";
import { useAppStore } from "@/lib/store";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "REJECTED", "CANCELLED", "BLOCKED"]);

export function useFireblocksStatusSync() {
  const { state, syncFireblocksTransferStatus } = useAppStore();

  useEffect(() => {
    const tracked = state.transfers.filter(
      (transfer) =>
        isRealFireblocksTxId(transfer.fireblocksTxId) &&
        (!transfer.fireblocksStatus || !TERMINAL_STATUSES.has(transfer.fireblocksStatus)),
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

          await syncFireblocksTransferStatus({
            externalTxId: transfer.id,
            fireblocksTxId: status.fireblocksTxId,
            status: status.status,
            subStatus: status.subStatus,
            statusSource: "fireblocks_api",
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
  }, [state.transfers, syncFireblocksTransferStatus]);
}
