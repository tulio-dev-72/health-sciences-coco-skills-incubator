import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig, isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/config";

const VALID_DEMO_ROLES = new Set(["analyst", "treasury_manager", "admin"]);

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (isDemoModeEnabled()) {
    const role = request.nextUrl.searchParams.get("role");
    if (role && VALID_DEMO_ROLES.has(role)) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("role");
      response = NextResponse.redirect(url);
      response.cookies.set("iwb_role", role, {
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });
      return response;
    }
    return response;
  }

  if (!isSupabaseConfigured()) {
    return response;
  }

  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isDemoRoute = pathname.startsWith("/demo");

  if (isDemoRoute && !user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (user && (pathname === "/auth/sign-in" || pathname === "/auth/sign-up")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.search = "";
    redirectUrl.pathname = profile?.role ? "/" : "/auth/role";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/auth/role") {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  }

  return response;
}
