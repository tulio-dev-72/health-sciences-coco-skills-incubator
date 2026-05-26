import type { AppState, UserRole } from "@/lib/types";
import { defaultPolicy, getFireblocksDemoVaultBalances } from "@/data/initial-data";
import { DEFAULT_BLUEPRINT_ID } from "@/data/demo-guide";
import { getPrimaryVaultBalances, PRIMARY_BLUEPRINT_ID } from "@/data/primary-scenario";
import { applyDemoScenario } from "@/data/demo-scenarios";
import { normalizeWorkflowStep } from "@/lib/workflow";

const STORAGE_KEY = "institutional-workflow-blueprints/session";
const SESSION_ROLE_KEY = "institutional-workflow-blueprints/role";
const SESSION_ROLE_BACKUP_KEY = "institutional-workflow-blueprints/role-backup";
const ROLE_COOKIE = "iwb_role";

function isUserRole(value: string | null | undefined): value is UserRole {
  return value === "analyst" || value === "treasury_manager" || value === "admin";
}

function readRoleCookie(): UserRole | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${ROLE_COOKIE}=([^;]*)`));
  const value = match?.[1] ? decodeURIComponent(match[1]) : null;
  return isUserRole(value) ? value : null;
}

function writeRoleCookie(role: UserRole | null): void {
  if (typeof document === "undefined") {
    return;
  }

  if (role) {
    document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Safari private mode and some mobile browsers block localStorage.
  }
}

function safeStorageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures on mobile browsers.
  }
}

function safeSessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures on mobile browsers.
  }
}

function safeSessionRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures on mobile browsers.
  }
}

export function persistSessionRole(role: UserRole | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (role) {
    safeStorageSet(SESSION_ROLE_KEY, role);
    safeSessionSet(SESSION_ROLE_BACKUP_KEY, role);
    writeRoleCookie(role);
  } else {
    safeStorageRemove(SESSION_ROLE_KEY);
    safeSessionRemove(SESSION_ROLE_BACKUP_KEY);
    writeRoleCookie(null);
  }
}

export function loadSessionRole(): UserRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Cookie is set by middleware on every login link tap — treat it as the source of truth.
  const fromCookie = readRoleCookie();
  if (isUserRole(fromCookie)) {
    return fromCookie;
  }

  const fromLocal = safeStorageGet(SESSION_ROLE_KEY);
  if (isUserRole(fromLocal)) {
    return fromLocal;
  }

  const fromSession = safeSessionGet(SESSION_ROLE_BACKUP_KEY);
  if (isUserRole(fromSession)) {
    return fromSession;
  }

  return null;
}

export function resolveEffectiveRole(state: AppState): UserRole | null {
  return state.role ?? loadSessionRole();
}

export function loadInitialAppState(): AppState {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  const saved = loadPersistedState();
  const role = loadSessionRole() ?? saved?.role ?? null;

  if (saved) {
    return role ? { ...saved, role } : saved;
  }

  if (role) {
    return { ...createEmptyState(), role };
  }

  return createEmptyState();
}

export function hasDemoSessionRole(state: AppState): boolean {
  return state.role !== null || loadSessionRole() !== null;
}

function stripLegacyDemoData(state: AppState): AppState {
  const hasLegacyUsdcDemo = state.transfers.some(
    (transfer) => transfer.id === "TRX-DEMO-001" && transfer.asset === "USDC",
  );

  if (!hasLegacyUsdcDemo) {
    return state;
  }

  return {
    ...state,
    transfers: [],
    auditLog: state.auditLog.filter((event) => !event.details.includes("TRX-DEMO-001")),
    vaultBalances: getFireblocksDemoVaultBalances(),
    fireblocksEnabled: true,
  };
}

function withDemoPendingIfEmpty(state: AppState): AppState {
  const base = stripLegacyDemoData(state);

  if (base.transfers.length > 0) {
    return base.fireblocksEnabled ? base : { ...base, fireblocksEnabled: true };
  }

  const blueprintId = base.activeBlueprint ?? DEFAULT_BLUEPRINT_ID;
  const defaultVaults =
    blueprintId === PRIMARY_BLUEPRINT_ID
      ? getPrimaryVaultBalances()
      : getFireblocksDemoVaultBalances();
  const seeded = applyDemoScenario(
    {
      transfers: [],
      auditLog: base.auditLog.filter((event) => !event.details.includes("TRX-DEMO-")),
      vaultBalances: defaultVaults,
    },
    blueprintId,
  );

  return {
    ...base,
    ...seeded,
    fireblocksEnabled: true,
  };
}

export function reseedDemoForBlueprint(state: AppState, blueprintId: string): AppState {
  const seeded = applyDemoScenario(
    {
      transfers: [],
      auditLog: [],
      vaultBalances: getFireblocksDemoVaultBalances(),
    },
    blueprintId,
  );

  return {
    ...state,
    activeBlueprint: blueprintId,
    transfers: seeded.transfers,
    auditLog: seeded.auditLog,
    vaultBalances: seeded.vaultBalances,
    lastTransferId: null,
    policySummary: null,
    fireblocksEnabled: true,
    workflowStep: "create",
  };
}

export function createEmptyState(): AppState {
  return withDemoPendingIfEmpty({
    role: null,
    activeBlueprint: DEFAULT_BLUEPRINT_ID,
    workflowStep: "create",
    lastTransferId: null,
    policySummary: null,
    policy: defaultPolicy,
    transfers: [],
    auditLog: [],
    vaultBalances: getFireblocksDemoVaultBalances(),
    fireblocksEnabled: false,
  });
}

export function loadPersistedState(): AppState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = safeStorageGet(STORAGE_KEY);
    const sessionRole = loadSessionRole();

    if (!raw) {
      return sessionRole ? { ...createEmptyState(), role: sessionRole } : null;
    }

    const parsed = JSON.parse(raw) as AppState;
    const storedRole =
      sessionRole ?? (isUserRole(parsed.role ?? null) ? parsed.role : null);

    return withDemoPendingIfEmpty({
      role: storedRole,
      activeBlueprint: parsed.activeBlueprint ?? DEFAULT_BLUEPRINT_ID,
      workflowStep: normalizeWorkflowStep(parsed.workflowStep),
      lastTransferId: parsed.lastTransferId ?? null,
      policySummary: parsed.policySummary ?? null,
      policy: {
        ...defaultPolicy,
        ...parsed.policy,
        whitelistedAddresses:
          parsed.policy?.whitelistedAddresses ?? defaultPolicy.whitelistedAddresses,
      },
      transfers: parsed.transfers ?? [],
      auditLog: parsed.auditLog ?? [],
      vaultBalances:
        parsed.vaultBalances?.length > 0
          ? parsed.vaultBalances.map((vault) => ({ ...vault }))
          : getFireblocksDemoVaultBalances(),
      fireblocksEnabled: parsed.fireblocksEnabled ?? true,
    });
  } catch {
    const sessionRole = loadSessionRole();
    return sessionRole ? { ...createEmptyState(), role: sessionRole } : null;
  }
}

export function commitDemoLogin(role: UserRole): void {
  if (typeof window === "undefined") {
    return;
  }

  persistSessionRole(role);
  const saved = loadPersistedState() ?? createEmptyState();
  safeStorageSet(
    STORAGE_KEY,
    JSON.stringify({
      ...saved,
      role,
    }),
  );
}

export function persistState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  const role = state.role ?? loadSessionRole();
  const payload = role ? { ...state, role } : state;

  if (role) {
    persistSessionRole(role);
  }

  safeStorageSet(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedState(): void {
  if (typeof window === "undefined") {
    return;
  }

  safeStorageRemove(STORAGE_KEY);
  persistSessionRole(null);
}

export function getAvailableBalance(
  state: AppState,
  asset: string,
): number {
  return (
    state.vaultBalances.find((vault) => vault.asset === asset)?.available ?? 0
  );
}
