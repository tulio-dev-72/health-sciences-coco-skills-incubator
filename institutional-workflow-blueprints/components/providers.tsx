"use client";

import Link from "next/link";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthStoreSync } from "@/components/auth/auth-store-sync";
import { AppProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthStoreSync />
        {children}
      </AppProvider>
    </AuthProvider>
  );
}
