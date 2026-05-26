"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { getRoleLabel as formatRoleLabel } from "@/lib/auth/role-labels";
import {
  createEmptyState,
  loadPersistedState,
  persistState,
  clearPersistedState,
  getAvailableBalance,
  loadSessionRole,
  persistSessionRole,
  commitDemoLogin,
  resolveEffectiveRole,
  reseedDemoForBlueprint,
} from "@/lib/storage";
import { formatCurrency } from "@/lib/format";
import { evaluateTransferPolicy, normalizeAddress } from "@/lib/policy";
import { AUDIT_ACTIONS } from "@/lib/audit";
import { getFireblocksStatusLabel } from "@/lib/fireblocks/lifecycle";
import { dedupeTransfersById } from "@/lib/fireblocks/transaction-validation";
import {
  isPrimaryBlueprint,
  PRIMARY_DEMO_TIMES,
  PRIMARY_SETTLEMENT,
} from "@/data/primary-scenario";
import { isSupabasePersistenceEnabled } from "@/lib/supabase/persistence";
import type { WorkflowSnapshot } from "@/lib/supabase/workflow/mappers";
import {
  apiApproveSettlement,
  apiCreateSettlement,
  apiRejectSettlement,
  apiUpdateFireblocksStatus,
  apiUpdatePolicy,
  fetchWorkflowState,
} from "@/lib/workflow/api-client";
import type { WorkflowStepId } from "@/lib/workflow";
import type {
  AppState,
  AuditEvent,
  PolicySettings,
  Transfer,
  UserRole,
} from "@/lib/types";

type CreateTransferInput = {
  asset: string;
  amount: number;
  destination: string;
  destinationLabel: string;
  reason: string;
  sourceVault?: string;
  settlementRail?: string;
  counterparty?: string;
};

type CreateTransferResult =
  | { ok: true; transferId: string }
  | { ok: false; error: string };

type AppAction =
  | { type: "HYDRATE"; state: AppState }
  | { type: "HYDRATE_FROM_SERVER"; snapshot: WorkflowSnapshot }
  | { type: "RESET_SESSION" }
  | { type: "SET_ROLE"; role: UserRole }
  | { type: "CLEAR_ROLE" }
  | { type: "SET_ACTIVE_BLUEPRINT"; blueprintId: string }
  | { type: "SET_WORKFLOW_STEP"; step: WorkflowStepId }
  | { type: "SET_FIREBLOCKS_ENABLED"; enabled: boolean }
  | { type: "SYNC_FIREBLOCKS_VAULTS"; vaults: AppState["vaultBalances"] }
  | {
      type: "CREATE_TRANSFER";
      transferId: string;
      input: CreateTransferInput;
      actor: string;
      role: UserRole;
    }
  | { type: "APPROVE_TRANSFER"; transferId: string; actor: string; role: UserRole; fireblocksTxId?: string; fireblocksStatus?: string }
  | { type: "REJECT_TRANSFER"; transferId: string; actor: string; role: UserRole }
  | {
      type: "UPDATE_FIREBLOCKS_STATUS";
      externalTxId: string;
      fireblocksTxId?: string;
      status: string;
      subStatus?: string | null;
    }
  | { type: "UPDATE_POLICY"; policy: Partial<PolicySettings>; actor: string; role: UserRole }
  | { type: "ADD_WHITELIST"; address: string; actor: string; role: UserRole }
  | { type: "REMOVE_WHITELIST"; address: string; actor: string; role: UserRole };

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function roleLabel(role: UserRole): string {
  return formatRoleLabel(role);
}

function appendAudit(
  auditLog: AuditEvent[],
  event: Omit<AuditEvent, "id" | "timestamp">,
  timestamp?: string,
): AuditEvent[] {
  return [
    {
      id: createId("AUD"),
      timestamp: timestamp ?? new Date().toISOString(),
      ...event,
    },
    ...auditLog,
  ];
}

function primaryTimestamp(
  state: AppState,
  key: keyof typeof PRIMARY_DEMO_TIMES,
): string | undefined {
  return isPrimaryBlueprint(state.activeBlueprint)
    ? PRIMARY_DEMO_TIMES[key]
    : undefined;
}

function updateVaultPending(
  balances: AppState["vaultBalances"],
  asset: string,
  delta: number,
): AppState["vaultBalances"] {
  return balances.map((vault) => {
    if (vault.asset !== asset) {
      return vault;
    }

    return {
      ...vault,
      available: Math.max(vault.available - delta, 0),
      pendingOut: vault.pendingOut + delta,
    };
  });
}

function settleVault(
  balances: AppState["vaultBalances"],
  asset: string,
  amount: number,
): AppState["vaultBalances"] {
  return balances.map((vault) => {
    if (vault.asset !== asset) {
      return vault;
    }

    return {
      ...vault,
      balance: vault.balance - amount,
      pendingOut: Math.max(vault.pendingOut - amount, 0),
    };
  });
}

function releaseVaultPending(
  balances: AppState["vaultBalances"],
  asset: string,
  amount: number,
): AppState["vaultBalances"] {
  return balances.map((vault) => {
    if (vault.asset !== asset) {
      return vault;
    }

    return {
      ...vault,
      available: vault.available + amount,
      pendingOut: Math.max(vault.pendingOut - amount, 0),
    };
  });
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "HYDRATE_FROM_SERVER":
      return {
        ...state,
        transfers: dedupeTransfersById(action.snapshot.transfers),
        auditLog: action.snapshot.auditLog,
        policy: action.snapshot.policy,
        lastTransferId: action.snapshot.lastTransferId,
        workflowStep: action.snapshot.workflowStep,
        policySummary: action.snapshot.policySummary,
      };
    case "RESET_SESSION":
      clearPersistedState();
      return createEmptyState();
    case "SET_ROLE":
      if (state.role === action.role) {
        return state;
      }
      return { ...state, role: action.role };
    case "CLEAR_ROLE":
      if (
        state.role === null &&
        state.workflowStep === "create" &&
        state.lastTransferId === null &&
        state.policySummary === null
      ) {
        return state;
      }
      return {
        ...state,
        role: null,
        workflowStep: "create",
        lastTransferId: null,
        policySummary: null,
      };
    case "SET_ACTIVE_BLUEPRINT":
      return reseedDemoForBlueprint(state, action.blueprintId);
    case "SET_WORKFLOW_STEP":
      return { ...state, workflowStep: action.step };
    case "SET_FIREBLOCKS_ENABLED":
      return { ...state, fireblocksEnabled: action.enabled };
    case "SYNC_FIREBLOCKS_VAULTS":
      return { ...state, vaultBalances: action.vaults };
    case "CREATE_TRANSFER": {
      const available = getAvailableBalance(state, action.input.asset);
      if (action.input.amount <= 0) {
        return state;
      }
      if (action.input.amount > available) {
        return state;
      }

      const now = new Date().toISOString();
      const evaluation = evaluateTransferPolicy({
        amount: action.input.amount,
        destination: action.input.destination,
        policy: state.policy,
      });

      const transfer: Transfer = {
        id: action.transferId,
        asset: action.input.asset,
        amount: action.input.amount,
        destination: action.input.destination,
        destinationLabel: action.input.destinationLabel,
        reason: action.input.reason,
        sourceVault: action.input.sourceVault,
        settlementRail: action.input.settlementRail,
        counterparty: action.input.counterparty,
        policyTrigger: evaluation.policyTrigger ?? undefined,
        requiredApprover: evaluation.requiredApprover ?? undefined,
        status: "CREATED",
        riskLevel: evaluation.riskLevel,
        requiresApproval: evaluation.requiresApproval,
        createdBy: action.actor,
        createdByRole: action.role,
        createdAt: primaryTimestamp(state, "initiated") ?? new Date().toISOString(),
        updatedAt: primaryTimestamp(state, "initiated") ?? new Date().toISOString(),
      };

      let auditLog = appendAudit(
        state.auditLog,
        {
          action: AUDIT_ACTIONS.settlementInitiated,
          actor: action.actor,
          role: action.role,
          details: `${formatCurrency(transfer.amount, transfer.asset)} USDC settlement to ${transfer.counterparty ?? transfer.destinationLabel}.`,
        },
        primaryTimestamp(state, "initiated"),
      );

      auditLog = appendAudit(
        auditLog,
        {
          action: AUDIT_ACTIONS.policyEvaluated,
          actor: "Policy Engine",
          role: "admin",
          details: evaluation.policyTrigger
            ? `${evaluation.policyTrigger} triggered. Required approver: ${evaluation.requiredApprover ?? "Treasury Manager"}.`
            : evaluation.reasons.join(" ") || "Within policy limits.",
        },
        primaryTimestamp(state, "policyEvaluated"),
      );

      let nextTransfer: Transfer = transfer;
      let vaultBalances = updateVaultPending(
        state.vaultBalances,
        transfer.asset,
        transfer.amount,
      );
      let workflowStep: WorkflowStepId = "policy";
      let policySummary = evaluation.requiresApproval
        ? evaluation.policyTrigger
          ? `${evaluation.policyTrigger} triggered. ${evaluation.requiredApprover ?? "Treasury Manager"} approval required.`
          : `Approval required. ${evaluation.reasons.join(" ")}`
        : "Transfer auto-approved below threshold and settled.";

      if (evaluation.requiresApproval) {
        nextTransfer = {
          ...transfer,
          status: "PENDING_APPROVAL",
          updatedAt: now,
        };
        auditLog = appendAudit(
          auditLog,
          {
            action: AUDIT_ACTIONS.authorizationQueued,
            actor: "Policy Engine",
            role: "admin",
            details: `Status: Pending Authorization. Routed to ${evaluation.requiredApprover ?? "Treasury Manager"}.`,
          },
          primaryTimestamp(state, "policyEvaluated"),
        );
      } else {
        auditLog = appendAudit(auditLog, {
          action: AUDIT_ACTIONS.managerAuthorized,
          actor: "Policy Engine",
          role: "admin",
          details: `${transfer.id} auto-approved below $${state.policy.approvalThreshold.toLocaleString()} threshold.`,
        });

        nextTransfer = {
          ...transfer,
          status: "SETTLED",
          reviewedBy: "Policy Engine",
          reviewedByRole: "admin",
          updatedAt: new Date().toISOString(),
        };
        vaultBalances = settleVault(vaultBalances, transfer.asset, transfer.amount);
        workflowStep = "audit";
        policySummary = "Transfer auto-approved below threshold and settled.";
      }

      const transfers = dedupeTransfersById([nextTransfer, ...state.transfers]);

      return {
        ...state,
        transfers,
        auditLog,
        vaultBalances,
        lastTransferId: transfer.id,
        policySummary,
        workflowStep,
      };
    }
    case "APPROVE_TRANSFER": {
      const transfer = state.transfers.find((item) => item.id === action.transferId);
      if (!transfer || transfer.status !== "PENDING_APPROVAL") {
        return state;
      }

      const fireblocksTxId =
        action.fireblocksTxId ??
        transfer.fireblocksTxId ??
        (isPrimaryBlueprint(state.activeBlueprint)
          ? PRIMARY_SETTLEMENT.demoFireblocksTxId
          : undefined);

      const approved: Transfer = {
        ...transfer,
        status: "APPROVED",
        reviewedBy: action.actor,
        reviewedByRole: action.role,
        fireblocksTxId,
        fireblocksStatus: action.fireblocksStatus,
        updatedAt: primaryTimestamp(state, "authorized") ?? new Date().toISOString(),
      };

      let auditLog = appendAudit(
        state.auditLog,
        {
          action: AUDIT_ACTIONS.managerAuthorized,
          actor: action.actor,
          role: action.role,
          details: `${formatCurrency(transfer.amount, transfer.asset)} settlement authorized for Fireblocks release.`,
        },
        primaryTimestamp(state, "authorized"),
      );

      if (fireblocksTxId) {
        auditLog = appendAudit(
          auditLog,
          {
            action: AUDIT_ACTIONS.fireblocksTransactionCreated,
            actor: "Fireblocks API",
            role: "admin",
            details: `fireblocksTxId: ${fireblocksTxId} · Vault Account: ${transfer.sourceVault ?? "Treasury Main"} · POST /v1/transactions`,
          },
          primaryTimestamp(state, "fireblocksCreated"),
        );
      }

      return {
        ...state,
        transfers: state.transfers.map((item) =>
          item.id === transfer.id ? approved : item,
        ),
        auditLog,
        lastTransferId: transfer.id,
        workflowStep: "audit",
        policySummary: `${transfer.id} authorized. Fireblocks transaction created — awaiting webhook lifecycle.`,
      };
    }
    case "REJECT_TRANSFER": {
      const transfer = state.transfers.find((item) => item.id === action.transferId);
      if (!transfer || transfer.status !== "PENDING_APPROVAL") {
        return state;
      }

      const rejected: Transfer = {
        ...transfer,
        status: "REJECTED",
        reviewedBy: action.actor,
        reviewedByRole: action.role,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...state,
        transfers: state.transfers.map((item) =>
          item.id === transfer.id ? rejected : item,
        ),
        auditLog: appendAudit(state.auditLog, {
          action: AUDIT_ACTIONS.settlementRejected,
          actor: action.actor,
          role: action.role,
          details: `${transfer.id} rejected by ${roleLabel(action.role)}.`,
        }),
        vaultBalances: releaseVaultPending(
          state.vaultBalances,
          transfer.asset,
          transfer.amount,
        ),
        lastTransferId: transfer.id,
        workflowStep: "audit",
        policySummary: `${transfer.id} rejected. Review the audit trail.`,
      };
    }
    case "UPDATE_FIREBLOCKS_STATUS": {
      const transfer = state.transfers.find(
        (item) =>
          item.id === action.externalTxId ||
          (action.fireblocksTxId && item.fireblocksTxId === action.fireblocksTxId),
      );

      if (!transfer) {
        return state;
      }

      const previousStatus = transfer.fireblocksStatus;
      const completed = action.status === "COMPLETED";
      const nextTransfer: Transfer = {
        ...transfer,
        fireblocksTxId: action.fireblocksTxId ?? transfer.fireblocksTxId,
        fireblocksStatus: action.status,
        status: completed ? "SETTLED" : transfer.status,
        updatedAt: new Date().toISOString(),
      };

      const webhookTimestamp =
        action.status === "PENDING_SIGNATURE"
          ? primaryTimestamp(state, "webhookPending")
          : action.status === "CONFIRMING"
            ? primaryTimestamp(state, "webhookConfirming")
            : action.status === "COMPLETED"
              ? primaryTimestamp(state, "completed")
              : undefined;

      let auditLog = appendAudit(
        state.auditLog,
        {
          action: AUDIT_ACTIONS.webhookStatusUpdated,
          actor: "Fireblocks Webhook",
          role: "admin",
          details: completed
            ? `${getFireblocksStatusLabel(action.status)} — institutional settlement finalized and recorded in audit trail.`
            : `${getFireblocksStatusLabel(action.status)} — webhook event received from Fireblocks infrastructure.`,
        },
        webhookTimestamp,
      );

      if (completed && previousStatus !== "COMPLETED") {
        auditLog = appendAudit(
          auditLog,
          {
            action: AUDIT_ACTIONS.settlementCompleted,
            actor: "Fireblocks Webhook",
            role: "admin",
            details: `${formatCurrency(transfer.amount, transfer.asset)} settlement completed on ${transfer.settlementRail ?? "Ethereum"}.`,
          },
          primaryTimestamp(state, "completed"),
        );
      }

      return {
        ...state,
        transfers: state.transfers.map((item) =>
          item.id === transfer.id ? nextTransfer : item,
        ),
        auditLog,
        vaultBalances: completed
          ? settleVault(state.vaultBalances, transfer.asset, transfer.amount)
          : state.vaultBalances,
        policySummary: completed
          ? "Settlement completed. Review the operational audit timeline."
          : state.policySummary,
      };
    }
    case "UPDATE_POLICY": {
      const nextPolicy = { ...state.policy, ...action.policy };
      return {
        ...state,
        policy: nextPolicy,
        auditLog: appendAudit(state.auditLog, {
          action: AUDIT_ACTIONS.tapPolicyUpdated,
          actor: action.actor,
          role: action.role,
          details: `Authorization threshold set to $${nextPolicy.approvalThreshold.toLocaleString()}.`,
        }),
      };
    }
    case "ADD_WHITELIST": {
      const normalized = normalizeAddress(action.address);
      if (
        state.policy.whitelistedAddresses.some(
          (entry) => normalizeAddress(entry) === normalized,
        )
      ) {
        return state;
      }

      return {
        ...state,
        policy: {
          ...state.policy,
          whitelistedAddresses: [...state.policy.whitelistedAddresses, action.address.trim()],
        },
        auditLog: appendAudit(state.auditLog, {
          action: AUDIT_ACTIONS.allowlistUpdated,
          actor: action.actor,
          role: action.role,
          details: `${action.address.trim()} added to destination allowlist.`,
        }),
      };
    }
    case "REMOVE_WHITELIST":
      return {
        ...state,
        policy: {
          ...state.policy,
          whitelistedAddresses: state.policy.whitelistedAddresses.filter(
            (entry) => normalizeAddress(entry) !== normalizeAddress(action.address),
          ),
        },
        auditLog: appendAudit(state.auditLog, {
          action: AUDIT_ACTIONS.allowlistUpdated,
          actor: action.actor,
          role: action.role,
          details: `${action.address} removed from destination allowlist.`,
        }),
      };
    default:
      return state;
  }
}

type AppContextValue = {
  state: AppState;
  sessionReady: boolean;
  effectiveRole: UserRole | null;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
  resetSession: () => void;
  setActiveBlueprint: (blueprintId: string) => void;
  setWorkflowStep: (step: WorkflowStepId) => void;
  setFireblocksEnabled: (enabled: boolean) => void;
  syncFireblocksVaults: (vaults: AppState["vaultBalances"]) => void;
  syncFireblocksTransferStatus: (input: {
    externalTxId: string;
    fireblocksTxId?: string;
    status: string;
    subStatus?: string | null;
  }) => Promise<void>;
  createTransfer: (
    input: CreateTransferInput,
    options?: { role?: UserRole },
  ) => Promise<CreateTransferResult>;
  approveTransfer: (
    transferId: string,
    fireblocks?: { fireblocksTxId: string; fireblocksStatus: string },
  ) => Promise<boolean>;
  rejectTransfer: (transferId: string) => Promise<boolean>;
  updatePolicy: (policy: Partial<PolicySettings>) => Promise<void>;
  addWhitelistAddress: (address: string) => Promise<void>;
  removeWhitelistAddress: (address: string) => Promise<void>;
  hydrateFromServer: (snapshot: WorkflowSnapshot) => void;
  refreshFromServer: () => Promise<void>;
  actorName: string;
};

const AppContext = createContext<AppContextValue | null>(null);

export function getActorName(role: UserRole): string {
  return roleLabel(role);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createEmptyState);
  const [sessionReady, setSessionReady] = useState(false);
  const sessionAuthedRef = useRef(false);

  useEffect(() => {
    const role = loadSessionRole();

    if (!isSupabasePersistenceEnabled()) {
      const saved = loadPersistedState();
      const resolvedRole = role ?? saved?.role ?? null;

      if (saved && !sessionAuthedRef.current) {
        dispatch({
          type: "HYDRATE",
          state: resolvedRole ? { ...saved, role: resolvedRole } : saved,
        });
      } else if (resolvedRole && !sessionAuthedRef.current) {
        dispatch({ type: "SET_ROLE", role: resolvedRole });
      }
    } else if (role && !sessionAuthedRef.current) {
      dispatch({ type: "SET_ROLE", role });
    }

    if (role) {
      commitDemoLogin(role);
    }

    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (sessionReady && !isSupabasePersistenceEnabled()) {
      persistState(state);
    }
  }, [state, sessionReady]);

  const effectiveRole = sessionReady ? resolveEffectiveRole(state) : state.role;
  const actorName = effectiveRole ? roleLabel(effectiveRole) : "Unsigned";

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      sessionReady,
      effectiveRole,
      actorName,
      setRole: (role) => {
        sessionAuthedRef.current = true;
        persistSessionRole(role);
        dispatch({ type: "SET_ROLE", role });
      },
      clearRole: () => {
        persistSessionRole(null);
        dispatch({ type: "CLEAR_ROLE" });
      },
      resetSession: () => dispatch({ type: "RESET_SESSION" }),
      setActiveBlueprint: (blueprintId) =>
        dispatch({ type: "SET_ACTIVE_BLUEPRINT", blueprintId }),
      setWorkflowStep: (step) => dispatch({ type: "SET_WORKFLOW_STEP", step }),
      setFireblocksEnabled: (enabled) =>
        dispatch({ type: "SET_FIREBLOCKS_ENABLED", enabled }),
      syncFireblocksVaults: (vaults) =>
        dispatch({ type: "SYNC_FIREBLOCKS_VAULTS", vaults }),
      hydrateFromServer: (snapshot) => dispatch({ type: "HYDRATE_FROM_SERVER", snapshot }),
      refreshFromServer: async () => {
        if (!isSupabasePersistenceEnabled()) {
          return;
        }
        const snapshot = await fetchWorkflowState();
        dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
      },
      syncFireblocksTransferStatus: async (input) => {
        if (isSupabasePersistenceEnabled()) {
          await apiUpdateFireblocksStatus(input);
          const snapshot = await fetchWorkflowState();
          dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
          return;
        }
        dispatch({ type: "UPDATE_FIREBLOCKS_STATUS", ...input });
      },
      createTransfer: async (input, options) => {
        const role = options?.role ?? resolveEffectiveRole(state);
        if (!role) {
          return { ok: false, error: "Select a role before creating a transfer." };
        }
        if (input.amount <= 0) {
          return { ok: false, error: "Amount must be greater than zero." };
        }
        if (!input.destination.trim() || !input.reason.trim()) {
          return { ok: false, error: "Destination address and settlement reason are required." };
        }

        if (isSupabasePersistenceEnabled()) {
          try {
            const result = await apiCreateSettlement({
              ...input,
              blueprintId: state.activeBlueprint,
            });
            const snapshot = await fetchWorkflowState();
            dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
            return { ok: true, transferId: result.transfer.id };
          } catch (error) {
            return {
              ok: false,
              error: error instanceof Error ? error.message : "Unable to create settlement.",
            };
          }
        }

        const available = getAvailableBalance(state, input.asset);
        if (input.amount > available) {
          return {
            ok: false,
            error: `Insufficient ${input.asset} available balance (${available.toLocaleString()}).`,
          };
        }

        const transferId = createId("TRX");
        dispatch({
          type: "CREATE_TRANSFER",
          transferId,
          input,
          actor: roleLabel(role),
          role,
        });
        return { ok: true, transferId };
      },
      approveTransfer: async (transferId, fireblocks) => {
        const role = resolveEffectiveRole(state);
        if (!role) return false;
        const transfer = state.transfers.find((item) => item.id === transferId);
        if (!transfer || transfer.status !== "PENDING_APPROVAL") return false;

        if (isSupabasePersistenceEnabled()) {
          try {
            await apiApproveSettlement(transferId, fireblocks);
            const snapshot = await fetchWorkflowState();
            dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
            return true;
          } catch {
            return false;
          }
        }

        dispatch({
          type: "APPROVE_TRANSFER",
          transferId,
          actor: roleLabel(role),
          role,
          fireblocksTxId: fireblocks?.fireblocksTxId,
          fireblocksStatus: fireblocks?.fireblocksStatus,
        });
        return true;
      },
      rejectTransfer: async (transferId) => {
        const role = resolveEffectiveRole(state);
        if (!role) return false;
        const transfer = state.transfers.find((item) => item.id === transferId);
        if (!transfer || transfer.status !== "PENDING_APPROVAL") return false;

        if (isSupabasePersistenceEnabled()) {
          try {
            await apiRejectSettlement(transferId);
            const snapshot = await fetchWorkflowState();
            dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
            return true;
          } catch {
            return false;
          }
        }

        dispatch({
          type: "REJECT_TRANSFER",
          transferId,
          actor: roleLabel(role),
          role,
        });
        return true;
      },
      updatePolicy: async (policy) => {
        const role = resolveEffectiveRole(state);
        if (!role) return;

        if (isSupabasePersistenceEnabled()) {
          await apiUpdatePolicy(policy);
          const snapshot = await fetchWorkflowState();
          dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
          return;
        }

        dispatch({
          type: "UPDATE_POLICY",
          policy,
          actor: roleLabel(role),
          role,
        });
      },
      addWhitelistAddress: async (address) => {
        const role = resolveEffectiveRole(state);
        if (!role) return;

        if (isSupabasePersistenceEnabled()) {
          await apiUpdatePolicy({
            whitelistedAddresses: [...state.policy.whitelistedAddresses, address.trim()],
          });
          const snapshot = await fetchWorkflowState();
          dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
          return;
        }

        dispatch({
          type: "ADD_WHITELIST",
          address,
          actor: roleLabel(role),
          role,
        });
      },
      removeWhitelistAddress: async (address) => {
        const role = resolveEffectiveRole(state);
        if (!role) return;

        if (isSupabasePersistenceEnabled()) {
          await apiUpdatePolicy({
            whitelistedAddresses: state.policy.whitelistedAddresses.filter(
              (item) => item !== address,
            ),
          });
          const snapshot = await fetchWorkflowState();
          dispatch({ type: "HYDRATE_FROM_SERVER", snapshot });
          return;
        }

        dispatch({
          type: "REMOVE_WHITELIST",
          address,
          actor: roleLabel(role),
          role,
        });
      },
    }),
    [state, sessionReady, effectiveRole, actorName],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppProvider");
  }
  return context;
}

export function getRoleLabel(role: UserRole): string {
  return roleLabel(role);
}
