import { createPublicKey, verify } from "crypto";
import { getFireblocksBaseUrl, getFireblocksConfig } from "@/lib/fireblocks/config";

const SANDBOX_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApZE6wL2+7P1ohvVYSpCd
gSgtmyGwiLbUC1UoGJhn1zwfY7ZWbNH7Pg8Osk8OzZTZHSG/arcgE8HnGCmGKtbE
QBkf2XlBRBQ01FcCMlZuJQJ3nElCPaMl9N6fq0VKNEIlVSVUpDCgvag5kFhDKS/L
p3YYJLFR46/hDlVLn+vM84diO3xGyMc16YJGNz7Z4jb8dmSZQE5E2XaQMDXW6uxC
c2ChjWJ3X5H70MzRG35JsN0j58SQTwbf4Pxm0aJfhPuaIBn3mJuZL5etsuFihoFG
FDnT+qWRcgD/pRNulBFAFhJeUnFrE4fFTJ1iaHhjBrStBCrxJk6QI0pGznoapTgA
QwIDAQAB
-----END PUBLIC KEY-----`;

function isSandboxWorkspace(): boolean {
  const basePath = getFireblocksConfig()?.basePath ?? getFireblocksBaseUrl();
  return basePath.includes("sandbox");
}

export function verifyFireblocksWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) {
    return false;
  }

  if (process.env.FIREBLOCKS_WEBHOOK_SKIP_VERIFY === "true") {
    return true;
  }

  try {
    const publicKey = createPublicKey(
      isSandboxWorkspace()
        ? SANDBOX_WEBHOOK_PUBLIC_KEY
        : (process.env.FIREBLOCKS_WEBHOOK_PUBLIC_KEY ?? SANDBOX_WEBHOOK_PUBLIC_KEY),
    );
    const signature = Buffer.from(signatureHeader, "base64");

    return verify("RSA-SHA512", rawBody, publicKey, signature);
  } catch {
    return false;
  }
}
