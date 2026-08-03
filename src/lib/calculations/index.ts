export type Money = bigint;
export type TaxType = "TAXABLE" | "ZERO_RATED" | "TAX_EXEMPT";
export interface QuotationItemInput { quantity: bigint; unitPrice: Money; discountRateBasisPoints: bigint; taxType: TaxType }
export interface QuotationItemTotal { baseAmount: Money; discountAmount: Money; supplyAmount: Money; vatAmount: Money; totalAmount: Money }
const roundDiv = (value: bigint, divisor: bigint) => (value + divisor / 2n) / divisor;
export function calculateQuotationItem(input: QuotationItemInput, vatRateBasisPoints = 1000n): QuotationItemTotal {
  if (input.quantity < 0n || input.unitPrice < 0n || input.discountRateBasisPoints < 0n || input.discountRateBasisPoints > 10000n) throw new RangeError("금액과 할인율을 확인해 주세요.");
  const baseAmount = input.quantity * input.unitPrice;
  const discountAmount = roundDiv(baseAmount * input.discountRateBasisPoints, 10000n);
  const supplyAmount = baseAmount - discountAmount;
  const vatAmount = input.taxType === "TAXABLE" ? roundDiv(supplyAmount * vatRateBasisPoints, 10000n) : 0n;
  return { baseAmount, discountAmount, supplyAmount, vatAmount, totalAmount: supplyAmount + vatAmount };
}
export function parseQuantity(value: string | number): bigint {
  const normalized = String(value).trim();
  if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) throw new RangeError("수량은 소수점 4자리 이하로 입력해 주세요.");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
}
export function calculateQuotationItemValues(quantity: string | number, unitPrice: number, discountRate: number, taxType: TaxType): QuotationItemTotal {
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 0 || !Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) throw new RangeError("단가와 할인율을 확인해 주세요.");
  const scaledQuantity = parseQuantity(quantity);
  if (scaledQuantity <= 0n) throw new RangeError("수량은 0보다 커야 합니다.");
  const baseAmount = roundDiv(scaledQuantity * BigInt(unitPrice), 10000n);
  const discountAmount = roundDiv(baseAmount * BigInt(Math.round(discountRate * 100)), 10000n);
  const supplyAmount = baseAmount - discountAmount;
  const vatAmount = taxType === "TAXABLE" ? roundDiv(supplyAmount * 1000n, 10000n) : 0n;
  return { baseAmount, discountAmount, supplyAmount, vatAmount, totalAmount: supplyAmount + vatAmount };
}
export function calculateQuotationTotals(items: Array<{ quantity: string | number; unitPrice: number; discountRate: number; taxType: TaxType }>) {
  return items.reduce((sum, item) => { const value = calculateQuotationItemValues(item.quantity, item.unitPrice, item.discountRate, item.taxType); return { subtotal: sum.subtotal + value.baseAmount, discountAmount: sum.discountAmount + value.discountAmount, taxableAmount: sum.taxableAmount + (item.taxType === "TAXABLE" ? value.supplyAmount : 0n), vatAmount: sum.vatAmount + value.vatAmount, totalAmount: sum.totalAmount + value.totalAmount }; }, { subtotal: 0n, discountAmount: 0n, taxableAmount: 0n, vatAmount: 0n, totalAmount: 0n });
}
export function calculateProjectSummary(contractAmount: Money, budgetAmount: Money, actualExpense: Money, payments: Money) {
  const remainingBudget = budgetAmount - actualExpense;
  const budgetUsageRate = budgetAmount === 0n ? 0 : Number((actualExpense * 10000n) / budgetAmount) / 100;
  const receivable = contractAmount - payments;
  const expectedProfit = contractAmount - budgetAmount;
  const actualProfit = payments - actualExpense;
  const actualProfitRate = contractAmount === 0n ? 0 : Number((actualProfit * 10000n) / contractAmount) / 100;
  return { remainingBudget, budgetUsageRate, receivable, isOverpaid: receivable < 0n, expectedProfit, actualProfit, actualProfitRate };
}
