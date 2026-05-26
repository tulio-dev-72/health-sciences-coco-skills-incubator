export const AUTH_SIGN_IN = "/auth/sign-in";
export const AUTH_SIGN_UP = "/auth/sign-up";
export const AUTH_ROLE = "/auth/role";
export const DEMO_LOGIN = "/demo/login";

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export function isPublicAuthPath(pathname: string): boolean {
  return pathname === AUTH_SIGN_IN || pathname === AUTH_SIGN_UP;
}

/** Public marketing / story pages — no session required. */
export function isPublicPath(pathname: string): boolean {
  return pathname === "/" || isPublicAuthPath(pathname);
}

export function isRoleSelectionPath(pathname: string): boolean {
  return pathname === AUTH_ROLE;
}

/** Routes that require a Supabase session (includes role selection). */
export function requiresAuth(pathname: string): boolean {
  if (isApiPath(pathname)) {
    return false;
  }
  if (isPublicPath(pathname)) {
    return false;
  }
  return true;
}

/** Routes that require auth + a profile role (operational app). */
export function requiresRole(pathname: string): boolean {
  if (isApiPath(pathname)) {
    return false;
  }
  if (isPublicPath(pathname) || isRoleSelectionPath(pathname)) {
    return false;
  }
  return true;
}

export function buildSignInUrl(nextPath: string): string {
  const params = new URLSearchParams({ next: nextPath });
  return `${AUTH_SIGN_IN}?${params.toString()}`;
}
