import { NextResponse } from "next/server";
import { requireWorkflowUser } from "@/lib/supabase/workflow/auth";
import { loadWorkflowState } from "@/lib/supabase/workflow/service";

export async function GET() {
  try {
    const auth = await requireWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const snapshot = await loadWorkflowState(auth.supabase);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load workflow state." },
      { status: 500 },
    );
  }
}
