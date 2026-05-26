import { NextResponse } from "next/server";
import {
  getWebhookEndpointOrigin,
  handleFireblocksWebhookEvent,
  listFireblocksWebhookDeliveries,
} from "@/lib/fireblocks/webhook-events";
import { verifyFireblocksWebhookSignature } from "@/lib/fireblocks/webhook-verify";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWorkflowUser } from "@/lib/supabase/workflow/auth";
import { loadWorkflowState } from "@/lib/supabase/workflow/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature =
    request.headers.get("fireblocks-signature") ??
    request.headers.get("Fireblocks-Signature");

  const isInternalSim =
    process.env.NODE_ENV === "development" &&
    request.headers.get("x-fireblocks-webhook-simulate") === "true";

  const signatureValid =
    isInternalSim || verifyFireblocksWebhookSignature(rawBody, signature);

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const result = await handleFireblocksWebhookEvent(payload, {
      signatureValid: !isInternalSim,
      rawBody: rawBody.toString("utf8"),
    });

    return NextResponse.json({
      ok: result.ok,
      deliveryStatus: result.deliveryStatus,
      eventId: result.eventId,
      settlementExternalId: result.settlementExternalId,
      fireblocksStatus: result.fireblocksStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process webhook event.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const origin = getWebhookEndpointOrigin(request);
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get("externalId");

  if (!externalId) {
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
        "Fireblocks Sandbox → Developer Center → Webhooks → paste endpoint URL → enable transaction events.",
    });
  }

  try {
    const auth = await requireWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const [deliveries, workflow] = await Promise.all([
      listFireblocksWebhookDeliveries(auth.supabase, {
        externalId,
        limit: 20,
      }),
      loadWorkflowState(auth.supabase),
    ]);

    const transfer =
      workflow.transfers.find((item) => item.id === externalId) ??
      workflow.transfers.find((item) => item.fireblocksTxId === externalId) ??
      null;

    const statuses = [...deliveries]
      .reverse()
      .map((item) => item.status)
      .filter((value, index, array) => array.indexOf(value) === index);

    const latest = deliveries[0];

    return NextResponse.json({
      externalId,
      statuses,
      latestStatus: latest?.status ?? transfer?.fireblocksStatus ?? null,
      deliveryStatus: latest?.delivery_status ?? null,
      completed: transfer?.status === "SETTLED" || latest?.status === "COMPLETED",
      transfer,
      deliveries,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load webhook lifecycle." },
      { status: 500 },
    );
  }
}
