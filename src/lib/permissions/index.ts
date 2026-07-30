export const roles = ["ADMIN", "MANAGER", "STAFF", "ACCOUNTING"] as const;
export type AppRole = (typeof roles)[number];
const permissions = { ADMIN:["manage:all"], MANAGER:["read:department","write:quotation","write:project","approve:small-expense"], STAFF:["read:assigned","write:quotation","write:statement","write:expense"], ACCOUNTING:["read:finance","write:payment","pay:expense","read:report"] } as const;
export function hasPermission(role: AppRole, permission: string) { return role === "ADMIN" || (permissions[role] as readonly string[]).includes(permission); }
