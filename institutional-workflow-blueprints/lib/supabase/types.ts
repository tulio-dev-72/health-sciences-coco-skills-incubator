import type { UserRole } from "@/lib/types";

export type UserProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfileRow = {
  id: string;
  email: string | null;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};
