"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { isSupabasePersistenceEnabled } from "@/lib/supabase/persistence";
import { fetchWorkflowState } from "@/lib/workflow/api-client";
import { useAppStore } from "@/lib/store";

/** Load workflow state from Supabase when authenticated. */
export function WorkflowStoreSync() {
  const { user, loading } = useAuth();
  const { hydrateFromServer, sessionReady } = useAppStore();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabasePersistenceEnabled() || !sessionReady || loading || !user) {
      return;
    }

    if (lastUserIdRef.current === user.id) {
      return;
    }

    lastUserIdRef.current = user.id;

    void fetchWorkflowState()
      .then((snapshot) => {
        hydrateFromServer(snapshot);
      })
      .catch(() => {
        lastUserIdRef.current = null;
      });
  }, [user, loading, sessionReady, hydrateFromServer]);

  return null;
}
