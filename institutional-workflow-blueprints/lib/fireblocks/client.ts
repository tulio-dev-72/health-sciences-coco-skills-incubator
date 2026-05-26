/**
 * Server-only Fireblocks SDK client.
 * Credentials resolve from FIREBLOCKS_PRIVATE_KEY (Vercel) or FIREBLOCKS_SECRET_KEY_PATH (local).
 */
import "server-only";

import { Fireblocks } from "@fireblocks/ts-sdk";
import { getRequiredFireblocksConfig } from "@/lib/fireblocks/config";

let client: Fireblocks | null = null;
let clientKeyFingerprint: string | null = null;

export function getFireblocksClient(): Fireblocks {
  const config = getRequiredFireblocksConfig();
  const fingerprint = `${config.apiKey}:${config.basePath}`;

  if (!client || clientKeyFingerprint !== fingerprint) {
    client = new Fireblocks({
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      basePath: config.basePath,
    });
    clientKeyFingerprint = fingerprint;
  }

  return client;
}
