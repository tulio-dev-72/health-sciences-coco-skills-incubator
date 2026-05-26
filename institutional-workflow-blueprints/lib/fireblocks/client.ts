import { Fireblocks } from "@fireblocks/ts-sdk";
import { getFireblocksConfig } from "@/lib/fireblocks/config";

let client: Fireblocks | null = null;

export function getFireblocksClient(): Fireblocks {
  const config = getFireblocksConfig();
  if (!config) {
    throw new Error("Fireblocks is not configured. Set FIREBLOCKS_API_KEY and FIREBLOCKS_SECRET_KEY.");
  }

  if (!client) {
    client = new Fireblocks({
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      basePath: config.basePath,
    });
  }

  return client;
}
