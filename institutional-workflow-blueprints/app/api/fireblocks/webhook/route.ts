import { NextResponse } from "next/server";
import { handleFireblocksWebhookEvent } from "@/lib/fireblocks/webhook-events";
import { verifyFireblocksWebhookSignature } from "@/lib/fireblocks/webhook-verify";

export const runtime = "nodejs";

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
    await handleFireblocksWebhookEvent(payload);
    return NextResponse.json({ ok: true });
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
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    endpoint: `${origin}/api/fireblocks/webhook`,
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
