import { Suspense } from "react";
import { AccessPortal } from "@/components/auth/access-portal";
import { PageLoadingState } from "@/components/ui/page-loading-state";

export default function AccessPortalPage() {
  return (
    <Suspense fallback={<PageLoadingState label="Loading institutional access portal…" />}>
      <AccessPortal />
    </Suspense>
  );
}
