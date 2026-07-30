import type { Prisma, PrismaClient } from "@prisma/client";
const prefixes = { quotation:"Q", statement:"S", project:"P", expense:"E", payment:"R" } as const;
export async function nextDocumentNumber(tx: Prisma.TransactionClient | PrismaClient, type: keyof typeof prefixes, year = new Date().getUTCFullYear()) {
 const sequence = await tx.documentSequence.upsert({ where:{type_year:{type,year}}, create:{type,year,currentValue:1}, update:{currentValue:{increment:1}} });
 return `${prefixes[type]}-${year}-${String(sequence.currentValue).padStart(5,"0")}`;
}
