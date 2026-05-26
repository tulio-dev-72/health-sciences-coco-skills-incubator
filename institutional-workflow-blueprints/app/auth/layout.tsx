import { AppHeader } from "@/components/layout/app-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ops-bg text-ops-text">
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-lg sm:px-6">{children}</main>
    </div>
  );
}
