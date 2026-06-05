import NextAuth from "next-auth";
import { authConfig } from "./config";

/**
 * Edge-compatible auth instance for middleware — uses the shared callbacks/config
 * only (no Prisma), so it can read and verify the JWT (and the role claim) at the
 * Edge. Do not import the full lib/auth here.
 */
export const { auth } = NextAuth(authConfig);
