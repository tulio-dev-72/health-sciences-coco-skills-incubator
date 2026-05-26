import { NextResponse } from "next/server";
import {
  assertRole,
  requirePersistedWorkflowUser,
} from "@/lib/supabase/workflow/auth";
import { updatePolicySettings } from "@/lib/supabase/workflow/service";

export async function PATCH(request: Request) {
  try {
    const auth = await requirePersistedWorkflowUser();
    if ("error" in auth) {
      return auth.error;
    }

    const roleError = assertRole(
      auth.role,
      ["admin"],
      "Only Platform Admin can manage enterprise workflow policies.",
    );
    if (roleError) {
      return roleError;
    }

    const body = (await request.json()) as {
      approvalThreshold?: number;
      whitelistedAddresses?: string[];
    };

    const policy = await updatePolicySettings(auth.supabase, auth.user.id, auth.role, body);
    return NextResponse.json({ policy });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update policy." },
      { status: 500 },
    );
  }
}
