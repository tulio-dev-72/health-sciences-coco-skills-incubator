import { NextResponse } from "next/server";
import {
  getWebhookEndpointOrigin,
  handleFireblocksWebhookEvent,
} from "@/lib/fireblocks/webhook-events";
import { verifyFireblocksWebhookSignature } from "@/lib/fireblocks/webhook-verify";

export const runtime = "nodejs";

/** @deprecated Use POST /api/webhooks/fireblocks */
export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature =
    request.headers.get("fireblocks-signature") ??
    request.headers.get("Fireblocks-Signature");

  if (!verifyFireblocksWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const result = await handleFireblocksWebhookEvent(payload, { signatureValid: true });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to process webhook event.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const origin = getWebhookEndpointOrigin(request);

  return NextResponse.json({
    endpoint: `${origin}/api/webhooks/fireblocks`,
    legacyEndpoint: `${origin}/api/fireblocks/webhook`,
    method: "POST",
    events: [
      "TRANSACTION_CREATED",
      "TRANSACTION_STATUS_UPDATED",
      "TRANSACTION_APPROVAL_STATUS_UPDATED",
    ],
    setup:
      "Fireblocks Sandbox → Developer Center → Webhooks → Create webhook → paste endpoint URL → enable transaction events.",
  });
}
