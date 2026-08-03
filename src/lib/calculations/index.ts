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
export function calculateProjectSummary(contractAmount: Money, budgetAmount: Money, actualExpense: Money, payments: Money) {
  const remainingBudget = budgetAmount - actualExpense;
  const budgetUsageRate = budgetAmount === 0n ? 0 : Number((actualExpense * 10000n) / budgetAmount) / 100;
  const receivable = contractAmount - payments;
  const expectedProfit = contractAmount - budgetAmount;
  const actualProfit = payments - actualExpense;
  const actualProfitRate = contractAmount === 0n ? 0 : Number((actualProfit * 10000n) / contractAmount) / 100;
  return { remainingBudget, budgetUsageRate, receivable, isOverpaid: receivable < 0n, expectedProfit, actualProfit, actualProfitRate };
}
