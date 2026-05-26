import { Suspense } from "react";
import { AccessPortal } from "@/components/auth/access-portal";

export default function AccessPortalPage() {
  return (
    <Suspense fallback={null}>
      <AccessPortal />
    </Suspense>
  );
}
