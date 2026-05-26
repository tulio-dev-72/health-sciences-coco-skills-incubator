import { NextResponse } from "next/server";
import {
  assertRole,
  requirePersistedWorkflowUser,
} from "@/lib/supabase/workflow/auth";
import { approveSettlement } from "@/lib/supabase/workflow/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requirePersistedWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const roleError = assertRole(
      auth.role,
      ["treasury_manager"],
      "Only Treasury Manager can authorize settlements for Fireblocks custody release.",
    );
    if (roleError) {
      return roleError;
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      fireblocksTxId?: string;
      fireblocksStatus?: string;
    };

    const transfer = await approveSettlement(auth.supabase, auth.user.id, auth.role, id, body);
    return NextResponse.json({ transfer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to approve settlement." },
      { status: 500 },
    );
  }
}
