import { NextResponse } from "next/server";
import {
  assertRole,
  requirePersistedWorkflowUser,
} from "@/lib/supabase/workflow/auth";
import { createSettlement } from "@/lib/supabase/workflow/service";

export async function POST(request: Request) {
  try {
    const auth = await requirePersistedWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const roleError = assertRole(auth.role, ["analyst"], "Only Treasury Analyst can create settlement requests.");
    if (roleError) {
      return roleError;
    }

    const body = (await request.json()) as {
      asset: string;
      amount: number;
      destination: string;
      destinationLabel: string;
      reason: string;
      sourceVault?: string;
      settlementRail?: string;
      counterparty?: string;
      blueprintId?: string | null;
    };

    const result = await createSettlement(auth.supabase, auth.user.id, auth.role, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create settlement." },
      { status: 500 },
    );
  }
}
