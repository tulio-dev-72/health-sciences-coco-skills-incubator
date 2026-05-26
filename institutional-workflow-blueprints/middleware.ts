import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function middleware(request: import("next/server").NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
