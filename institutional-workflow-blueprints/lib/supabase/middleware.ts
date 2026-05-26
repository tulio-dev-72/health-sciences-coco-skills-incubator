import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ROLE,
  AUTH_SIGN_IN,
  AUTH_SIGN_UP,
  buildSignInUrl,
  isPublicAuthPath,
  isRoleSelectionPath,
  requiresAuth,
  requiresRole,
} from "@/lib/supabase/routes";
import { getSupabasePublicConfig, isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/config";

const VALID_DEMO_ROLES = new Set(["analyst", "treasury_manager", "admin"]);

async function fetchProfileRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role ?? null;
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

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

  if (!user && requiresAuth(pathname)) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = AUTH_SIGN_IN;
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (user && isPublicAuthPath(pathname)) {
    const role = await fetchProfileRole(supabase, user.id);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.search = "";
    redirectUrl.pathname = role ? "/" : AUTH_ROLE;
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isRoleSelectionPath(pathname)) {
    const role = await fetchProfileRole(supabase, user.id);
    if (role) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    return response;
  }

  if (user && requiresRole(pathname)) {
    const role = await fetchProfileRole(supabase, user.id);
    if (!role) {
      const roleUrl = request.nextUrl.clone();
      roleUrl.pathname = AUTH_ROLE;
      roleUrl.search = "";
      return NextResponse.redirect(roleUrl);
    }
  }

  if (!user && pathname === AUTH_ROLE) {
    return NextResponse.redirect(new URL(buildSignInUrl(AUTH_ROLE), request.url));
  }

  return response;
}
