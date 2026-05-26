import { Suspense } from "react";
import AccessRestrictedPage from "./access-restricted-content";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="ops-page">
          <p className="text-sm text-ops-text-secondary">Loading access control…</p>
        </main>
      }
    >
      <AccessRestrictedPage />
    </Suspense>
  );
}
