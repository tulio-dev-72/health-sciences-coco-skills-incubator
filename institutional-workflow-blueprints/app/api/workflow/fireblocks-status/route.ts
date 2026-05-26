import { NextResponse } from "next/server";
import type { SettlementStatusSource } from "@/lib/fireblocks/lifecycle";
import { createSupabaseAdminClientIfConfigured } from "@/lib/supabase/admin";
import { requireWorkflowUser } from "@/lib/supabase/workflow/auth";
import { updateSettlementFireblocksStatus } from "@/lib/supabase/workflow/service";

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

    const auth = await requireWorkflowUser();
    if ("error" in auth) {
      return auth.error;
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
