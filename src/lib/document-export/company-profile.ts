import type { Prisma, SupplierProfile } from "@prisma/client";

export type SupplierSnapshot = {
  supplierProfileId: string; profileName: string; companyName: string; businessNumber: string;
  representativeName: string; businessType: string; businessCategory: string; address: string;
  detailedAddress: string; postalCode: string; phone: string; fax: string; email: string;
  documentManagerName: string; documentManagerPhone: string; documentManagerEmail: string;
  bankName: string; bankAccount: string; accountHolder: string; logoUrl: string | null;
  sealUrl: string | null; capturedAt: string;
};
const value = (input: string | null | undefined) => input ?? "";
export function createSupplierSnapshot(profile: SupplierProfile, capturedAt = new Date()): SupplierSnapshot {
  return { supplierProfileId: profile.id, profileName: profile.profileName, companyName: profile.companyName,
    businessNumber: profile.businessNumber, representativeName: profile.representativeName,
    businessType: value(profile.businessType), businessCategory: value(profile.businessCategory),
    address: value(profile.address), detailedAddress: value(profile.detailedAddress), postalCode: value(profile.postalCode),
    phone: value(profile.phone), fax: value(profile.fax), email: value(profile.email),
    documentManagerName: value(profile.documentManagerName), documentManagerPhone: value(profile.documentManagerPhone),
    documentManagerEmail: value(profile.documentManagerEmail), bankName: value(profile.bankName),
    bankAccount: value(profile.bankAccount), accountHolder: value(profile.accountHolder), logoUrl: profile.logoUrl,
    sealUrl: profile.sealUrl, capturedAt: capturedAt.toISOString() };
}
export function loadSupplierSnapshot(snapshot: Prisma.JsonValue | null | undefined): SupplierSnapshot | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const row = snapshot as Record<string, unknown>;
  if (typeof row.supplierProfileId !== "string" || typeof row.companyName !== "string") return null;
  return row as SupplierSnapshot;
}
export const snapshotAsJson = (snapshot: SupplierSnapshot) => snapshot as unknown as Prisma.InputJsonValue;
export function formatBusinessNumber(number: string) { const digits=number.replace(/\D/g,""); return digits.length===10?`${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`:number; }
