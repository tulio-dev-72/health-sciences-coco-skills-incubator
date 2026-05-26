import { NextResponse } from "next/server";
import {
  getWebhookEndpointOrigin,
  handleFireblocksWebhookEvent,
  listFireblocksWebhookDeliveries,
} from "@/lib/fireblocks/webhook-events";
import { assertRole, requireWorkflowUser } from "@/lib/supabase/workflow/auth";

export const runtime = "nodejs";

/** Admin-only recent webhook delivery log for integration screen. */
export async function GET(request: Request) {
  try {
    const auth = await requireWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const roleError = assertRole(auth.role, ["admin"]);
    if (roleError) {
      return roleError;
    }

    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "15");
    const deliveries = await listFireblocksWebhookDeliveries(auth.supabase, { limit });

    return NextResponse.json({
      endpoint: `${getWebhookEndpointOrigin(request)}/api/webhooks/fireblocks`,
      deliveries,
      summary: {
        total: deliveries.length,
        processed: deliveries.filter((item) => item.delivery_status === "processed").length,
        failed: deliveries.filter((item) => item.delivery_status === "failed").length,
        ignored: deliveries.filter((item) => item.delivery_status === "ignored").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load webhook deliveries." },
      { status: 500 },
    );
  }
}
