import type { Prisma, PrismaClient } from "@prisma/client";
const prefixes = { quotation:"Q", statement:"S", project:"P", expense:"E", payment:"R" } as const;
const SQLITE_RETRYABLE_CODES = new Set(["P1008", "P2028", "P2034"]);

function isRetryableSqliteError(error: unknown): boolean {
 return typeof error === "object" && error !== null && "code" in error &&
  typeof error.code === "string" && SQLITE_RETRYABLE_CODES.has(error.code);
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function nextDocumentNumber(tx: Prisma.TransactionClient | PrismaClient, type: keyof typeof prefixes, issuedAt: Date | number = new Date()) {
 const period = typeof issuedAt === "number" ? issuedAt : issuedAt.getUTCFullYear() * 100 + issuedAt.getUTCMonth() + 1;
 for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
   // SQLite serializes writes. A single upsert with an atomic increment prevents
   // duplicate sequence values without PostgreSQL-specific SQL or locks.
   const sequence = await tx.documentSequence.upsert({ where:{type_year:{type,year:period}}, create:{type,year:period,currentValue:1}, update:{currentValue:{increment:1}} });
   return `${prefixes[type]}-${period}-${String(sequence.currentValue).padStart(4,"0")}`;
  } catch (error) {
   if (!isRetryableSqliteError(error) || attempt === 4) throw error;
   await wait(50 * (attempt + 1));
  }
 }
 throw new Error("문서번호를 생성하지 못했습니다.");
}
