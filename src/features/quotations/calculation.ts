import { Prisma } from "@prisma/client";
import { calculateQuotationItemValues } from "@/lib/calculations";
export type QuotationCalculationInput = { productId?: string | null; name: string; specification?: string | null; unit: string; quantity: string; unitPrice: string; discountRate: string; note?: string | null };
function money(value: bigint) { if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("금액이 허용 범위를 초과했습니다."); return Number(value); }
export function calculateQuotationPersistence(items: QuotationCalculationInput[]) {
  let subtotal = 0n, discountAmount = 0n, taxableAmount = 0n, vatAmount = 0n, totalAmount = 0n;
  const calculated = items.map((item, index) => { const result = calculateQuotationItemValues(item.quantity, Number(item.unitPrice), Number(item.discountRate), "TAXABLE"); subtotal += result.baseAmount; discountAmount += result.discountAmount; taxableAmount += result.supplyAmount; vatAmount += result.vatAmount; totalAmount += result.totalAmount; return { productId: item.productId || null, sortOrder: index + 1, name: item.name, specification: item.specification || null, unit: item.unit, quantity: new Prisma.Decimal(item.quantity), unitPrice: money(BigInt(item.unitPrice)), discountRate: new Prisma.Decimal(item.discountRate), supplyAmount: money(result.supplyAmount), vatAmount: money(result.vatAmount), totalAmount: money(result.totalAmount), taxType: "TAXABLE" as const, note: item.note || null }; });
  return { calculated, totals: { subtotal: money(subtotal), discountAmount: money(discountAmount), taxableAmount: money(taxableAmount), vatAmount: money(vatAmount), totalAmount: money(totalAmount) } };
}
