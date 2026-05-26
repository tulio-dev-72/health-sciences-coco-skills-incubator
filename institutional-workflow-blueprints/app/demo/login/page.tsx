"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ACCESS_PORTAL, OPERATIONS_HOME } from "@/lib/supabase/routes";

function DemoLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? OPERATIONS_HOME;

  useEffect(() => {
    const target = next === OPERATIONS_HOME ? ACCESS_PORTAL : `${ACCESS_PORTAL}?next=${encodeURIComponent(next)}`;
    router.replace(target);
  }, [router, next]);

  return null;
}

export default function DemoLoginPage() {
  return (
    <Suspense fallback={null}>
      <DemoLoginRedirect />
    </Suspense>
  );
}
