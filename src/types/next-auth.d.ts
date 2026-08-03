import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/permissions";
declare module "next-auth" {
  interface User { role: AppRole }
  interface Session { user: DefaultSession["user"] & { id: string; role: AppRole } }
}
