"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchFireblocksStatus } from "@/lib/fireblocks/api-client";
import type { FireblocksIntegrationStatus, FireblocksStatus } from "@/lib/fireblocks/types";
import { OFFLINE_FIREBLOCKS_STATUS } from "@/lib/fireblocks/types";

export function useFireblocksConnection() {
  const [status, setStatus] = useState<FireblocksStatus>(OFFLINE_FIREBLOCKS_STATUS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchFireblocksStatus();
      setStatus(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const integrationStatus: FireblocksIntegrationStatus = status.integrationStatus;
  const connected = integrationStatus === "connected";

  return {
    status,
    loading,
    refresh,
    connected,
    integrationStatus,
  };
}
