import type { UserRole } from "@/lib/types";

export function getRoleLabel(role: string): string {
  switch (role) {
    case "analyst":
      return "Treasury Analyst";
    case "treasury_manager":
      return "Treasury Manager";
    case "admin":
      return "Platform Admin";
    default:
      return "Account";
  }
}

export function isUserRole(role: string): role is UserRole {
  return role === "analyst" || role === "treasury_manager" || role === "admin";
}
