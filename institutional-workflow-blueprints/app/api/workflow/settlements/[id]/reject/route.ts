import { NextResponse } from "next/server";
import { assertRole, requireWorkflowUser } from "@/lib/supabase/workflow/auth";
import { rejectSettlement } from "@/lib/supabase/workflow/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const roleError = assertRole(auth.role, ["treasury_manager", "admin"]);
    if (roleError) {
      return roleError;
    }

    const { id } = await context.params;
    const transfer = await rejectSettlement(auth.supabase, auth.user.id, auth.role, id);
    return NextResponse.json({ transfer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reject settlement." },
      { status: 500 },
    );
  }
}
