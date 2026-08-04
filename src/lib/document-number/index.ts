import type { Prisma, PrismaClient } from "@prisma/client";
const prefixes = { quotation:"Q", statement:"S", project:"P", expense:"E", payment:"R" } as const;
const procurementPrefixes = { rfq:"RFQ", supplierQuotation:"SQ", purchaseOrder:"PO", goodsReceipt:"GR", purchaseDisbursement:"PAYOUT" } as const;
const SQLITE_RETRYABLE_CODES = new Set(["P1008", "P2028", "P2034"]);

function isRetryableSqliteError(error: unknown): boolean {
 return typeof error === "object" && error !== null && "code" in error &&
  typeof error.code === "string" && SQLITE_RETRYABLE_CODES.has(error.code);
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
export async function nextOrderNumber(tx: Prisma.TransactionClient | PrismaClient, date=new Date()) { const period=date.getUTCFullYear()*100+date.getUTCMonth()+1; for(let attempt=0;attempt<5;attempt++){try{const sequence=await tx.documentSequence.upsert({where:{type_year:{type:"order",year:period}},create:{type:"order",year:period,currentValue:1},update:{currentValue:{increment:1}}});return `O-${period}-${String(sequence.currentValue).padStart(5,"0")}`}catch(error){if(!isRetryableSqliteError(error)||attempt===4)throw error;await wait(50*(attempt+1))}}throw new Error("오더번호를 생성하지 못했습니다.")}

export async function nextDocumentNumber(tx: Prisma.TransactionClient | PrismaClient, type: keyof typeof prefixes, year = new Date().getUTCFullYear()) {
 for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
   // SQLite serializes writes. A single upsert with an atomic increment prevents
   // duplicate sequence values without PostgreSQL-specific SQL or locks.
   const sequence = await tx.documentSequence.upsert({ where:{type_year:{type,year}}, create:{type,year,currentValue:1}, update:{currentValue:{increment:1}} });
   return `${prefixes[type]}-${year}-${String(sequence.currentValue).padStart(5,"0")}`;
  } catch (error) {
   if (!isRetryableSqliteError(error) || attempt === 4) throw error;
   await wait(50 * (attempt + 1));
  }
 }
 throw new Error("문서번호를 생성하지 못했습니다.");
}

export async function nextProcurementNumber(tx: Prisma.TransactionClient | PrismaClient, type: keyof typeof procurementPrefixes, date = new Date()) {
 const period = date.getUTCFullYear() * 100 + date.getUTCMonth() + 1;
 for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
   const sequence = await tx.documentSequence.upsert({ where:{type_year:{type,year:period}}, create:{type,year:period,currentValue:1}, update:{currentValue:{increment:1}} });
   return `${procurementPrefixes[type]}-${period}-${String(sequence.currentValue).padStart(5,"0")}`;
  } catch (error) {
   if (!isRetryableSqliteError(error) || attempt === 4) throw error;
   await wait(50 * (attempt + 1));
  }
 }
 throw new Error("구매 문서번호를 생성하지 못했습니다.");
}
