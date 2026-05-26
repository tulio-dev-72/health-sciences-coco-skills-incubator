import { NextResponse } from "next/server";
import {
  assertRole,
  requirePersistedWorkflowUser,
} from "@/lib/supabase/workflow/auth";
import { updateSettlementFireblocksStatus } from "@/lib/supabase/workflow/service";
import type { SettlementStatusSource } from "@/lib/fireblocks/lifecycle";
import { createSupabaseAdminClientIfConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      externalTxId?: string;
      fireblocksTxId?: string;
      status: string;
      subStatus?: string | null;
      eventType?: string;
      payload?: Record<string, unknown>;
      statusSource?: SettlementStatusSource;
    };

    const admin = createSupabaseAdminClientIfConfigured();
    if (admin) {
      const transfer = await updateSettlementFireblocksStatus(admin, body);
      return NextResponse.json({ transfer });
    }

    const auth = await requirePersistedWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const roleError = assertRole(
      auth.role,
      ["treasury_manager", "admin"],
      "Lifecycle status updates are limited to Treasury Manager and Platform Admin.",
    );
    if (roleError) {
      return roleError;
    }

    const transfer = await updateSettlementFireblocksStatus(auth.supabase, body);
    return NextResponse.json({ transfer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update Fireblocks status." },
      { status: 500 },
    );
  }
}
