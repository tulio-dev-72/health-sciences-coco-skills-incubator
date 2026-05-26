"use client";

import {
  fetchFireblocksStatus,
  fetchFireblocksTreasuryState,
  submitFireblocksTransfer,
} from "@/lib/fireblocks/api-client";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import {
  FireblocksSubmitError,
  buildTransactionDebugInfo,
  classifyFireblocksApiError,
  validateFireblocksTransaction,
  type FireblocksTransactionDebugInfo,
  type FireblocksTransactionFailureCategory,
} from "@/lib/fireblocks/transaction-validation";
import type { Transfer } from "@/lib/types";

export type AuthorizedFireblocksTransferResult = {
  fireblocksTxId: string;
  fireblocksStatus: string;
  demoMode: boolean;
  debug: FireblocksTransactionDebugInfo;
};

export type AuthorizedFireblocksTransferFailure = {
  message: string;
  category: FireblocksTransactionFailureCategory;
  debug: FireblocksTransactionDebugInfo;
  raw?: string;
  apiResponse?: unknown;
};

export async function submitAuthorizedFireblocksTransfer(
  transfer: Transfer,
): Promise<AuthorizedFireblocksTransferResult> {
  const integration = await fetchFireblocksStatus();
  const offlineDebug = buildTransactionDebugInfo({ transfer, treasury: null });

  if (integration.integrationStatus !== "connected") {
    if (!isDemoModeEnabled()) {
      throw new FireblocksSubmitError({
        message:
          "Fireblocks is not connected. Configure sandbox credentials or enable Demo Mode for simulated lifecycle.",
        category: "integration_offline",
        debug: offlineDebug,
      });
    }

    return {
      fireblocksTxId: "",
      fireblocksStatus: "SUBMITTED",
      demoMode: true,
      debug: offlineDebug,
    };
  }

  const treasury = await fetchFireblocksTreasuryState();
  if (treasury.degradedMode || !treasury.vault) {
    throw new FireblocksSubmitError({
      message: treasury.message || "Fireblocks treasury state is unavailable.",
      category: "invalid_vault",
      debug: buildTransactionDebugInfo({ transfer, treasury: null }),
    });
  }

  let externalTxIdAlreadyUsed = false;
  try {
    const statusResponse = await fetch(
      `/api/fireblocks/transactions/status?externalTxId=${encodeURIComponent(transfer.id)}`,
      { cache: "no-store" },
    );
    if (statusResponse.ok) {
      externalTxIdAlreadyUsed = true;
    }
  } catch {
    // Ignore lookup failures — server validation will still guard duplicates.
  }

  const validation = validateFireblocksTransaction({
    transfer,
    treasury,
    externalTxIdAlreadyUsed,
  });

  if (!validation.ok) {
    throw new FireblocksSubmitError({
      message: validation.message,
      category: validation.category,
      debug: validation.debug,
    });
  }

  try {
    const result = await submitFireblocksTransfer(validation.payload);

    return {
      fireblocksTxId: result.fireblocksTxId,
      fireblocksStatus: result.status,
      demoMode: false,
      debug: validation.debug,
    };
  } catch (error) {
    if (error instanceof FireblocksSubmitError) {
      throw error;
    }

    const classified = classifyFireblocksApiError(error);
    throw new FireblocksSubmitError({
      message: classified.message,
      category: classified.category,
      debug: validation.debug,
      raw: classified.raw,
      apiResponse: error instanceof Error ? { message: error.message } : error,
    });
  }
}

export function toAuthorizationFailure(
  error: unknown,
  transfer: Transfer,
): AuthorizedFireblocksTransferFailure {
  if (error instanceof FireblocksSubmitError) {
    return {
      message: error.message,
      category: error.category,
      debug: error.debug ?? buildTransactionDebugInfo({ transfer, treasury: null }),
      raw: error.raw,
      apiResponse: error.apiResponse,
    };
  }

  const classified = classifyFireblocksApiError(error);
  return {
    message: classified.message,
    category: classified.category,
    debug: buildTransactionDebugInfo({ transfer, treasury: null }),
    raw: classified.raw,
  };
}
