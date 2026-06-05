/** App roles. Stored as a string on User.role; ADMIN unlocks /admin. */
export type Role = "USER" | "ADMIN";

export function isAdmin(role: string | undefined | null): boolean {
  return role === "ADMIN";
}
