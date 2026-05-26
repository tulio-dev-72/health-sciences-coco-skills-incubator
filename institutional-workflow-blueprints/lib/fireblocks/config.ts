import "server-only";

import { readFileSync } from "fs";
import { homedir } from "os";

import type { FireblocksIntegrationStatus } from "@/lib/fireblocks/types";

export type FireblocksConfig = {
  apiKey: string;
  secretKey: string;
  basePath: string;
  sourceVaultId: string;
  assetIds: Record<string, string>;
};

const MISSING_PRIVATE_KEY_ERROR =
  "Fireblocks private key is not configured. Set FIREBLOCKS_PRIVATE_KEY (production) or FIREBLOCKS_SECRET_KEY_PATH (local development).";

/** Normalize PEM stored in env vars with literal \\n sequences. */
function normalizePrivateKey(raw: string): string {
  return raw.trim().replace(/\\n/g, "\n");
}

function expandSecretKeyPath(path: string): string {
  if (path.startsWith("~/")) {
    return `${homedir()}${path.slice(1)}`;
  }
  return path;
}

export function getFireblocksBaseUrl(): string {
  return (
    process.env.FIREBLOCKS_BASE_URL?.trim() ??
    process.env.FIREBLOCKS_BASE_PATH?.trim() ??
    "https://sandbox-api.fireblocks.io/v1"
  );
}

function loadPrivateKeyFromEnv(): string | null {
  const inline = process.env.FIREBLOCKS_PRIVATE_KEY?.trim();
  if (!inline) {
    return null;
  }
  return normalizePrivateKey(inline);
}

function loadPrivateKeyFromPath(required: boolean): string | null {
  const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH?.trim();
  if (!secretKeyPath) {
    if (required) {
      throw new Error(MISSING_PRIVATE_KEY_ERROR);
    }
    return null;
  }

  const resolvedPath = expandSecretKeyPath(secretKeyPath);

  try {
    return normalizePrivateKey(readFileSync(resolvedPath, "utf8"));
  } catch {
    if (required) {
      throw new Error(
        `Unable to read Fireblocks private key from FIREBLOCKS_SECRET_KEY_PATH (${resolvedPath}).`,
      );
    }
    return null;
  }
}

/** Server-only: resolves signing key from env var (Vercel) or local file path. */
export function resolveFireblocksPrivateKey(options?: { required?: boolean }): string | null {
  const fromEnv = loadPrivateKeyFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH?.trim();
  if (secretKeyPath) {
    return loadPrivateKeyFromPath(Boolean(options?.required));
  }

  if (options?.required) {
    throw new Error(MISSING_PRIVATE_KEY_ERROR);
  }

  return null;
}

export function getFireblocksIntegrationStatus(): {
  configured: boolean;
  integrationStatus: FireblocksIntegrationStatus;
  message: string;
} {
  const apiKey = process.env.FIREBLOCKS_API_KEY?.trim();
  const hasInlineKey = Boolean(process.env.FIREBLOCKS_PRIVATE_KEY?.trim());
  const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH?.trim();

  if (!apiKey) {
    return {
      configured: false,
      integrationStatus: "offline",
      message: "Fireblocks is offline. Set FIREBLOCKS_API_KEY in server environment variables.",
    };
  }

  if (!hasInlineKey && !secretKeyPath) {
    return {
      configured: false,
      integrationStatus: "offline",
      message:
        "Fireblocks is offline. Set FIREBLOCKS_PRIVATE_KEY (Vercel) or FIREBLOCKS_SECRET_KEY_PATH (local development).",
    };
  }

  const privateKey = resolveFireblocksPrivateKey();
  if (!privateKey) {
    if (secretKeyPath && !hasInlineKey) {
      return {
        configured: false,
        integrationStatus: "offline",
        message: `Fireblocks is offline. Unable to read private key from FIREBLOCKS_SECRET_KEY_PATH (${expandSecretKeyPath(secretKeyPath)}).`,
      };
    }

    return {
      configured: false,
      integrationStatus: "offline",
      message: "Fireblocks is offline. Private key could not be loaded from server environment.",
    };
  }

  return {
    configured: true,
    integrationStatus: "connected",
    message:
      "Fireblocks connected. Server-side SDK is ready for custody, signing, and webhook-driven settlement.",
  };
}

export function isFireblocksConfigured(): boolean {
  return getFireblocksConfig() !== null;
}

export function getFireblocksConfig(): FireblocksConfig | null {
  const apiKey = process.env.FIREBLOCKS_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const secretKey = resolveFireblocksPrivateKey();
  if (!secretKey) {
    return null;
  }

  return buildFireblocksConfig(apiKey, secretKey);
}

/** Server-only: throws if API key or private key is missing. */
export function getRequiredFireblocksConfig(): FireblocksConfig {
  const apiKey = process.env.FIREBLOCKS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Fireblocks API key is not configured. Set FIREBLOCKS_API_KEY.");
  }

  const secretKey = resolveFireblocksPrivateKey({ required: true });
  if (!secretKey) {
    throw new Error(MISSING_PRIVATE_KEY_ERROR);
  }

  return buildFireblocksConfig(apiKey, secretKey);
}

function buildFireblocksConfig(apiKey: string, secretKey: string): FireblocksConfig {
  return {
    apiKey,
    secretKey,
    basePath: getFireblocksBaseUrl(),
    sourceVaultId: process.env.FIREBLOCKS_SOURCE_VAULT_ID?.trim() ?? "0",
    assetIds: {},
  };
}

/** Pass-through: asset IDs come from Fireblocks SDK discovery, not static maps. */
export function resolveFireblocksAssetId(assetId: string): string | null {
  const trimmed = assetId.trim();
  return trimmed.length > 0 ? trimmed : null;
}
