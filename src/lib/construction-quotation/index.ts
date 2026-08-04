export const QUOTATION_COST_CATEGORIES = ["MATERIAL", "LABOR", "EXPENSE", "TRAVEL"] as const;
export type QuotationCostCategory = (typeof QUOTATION_COST_CATEGORIES)[number];
export const quotationCostCategoryLabels: Record<QuotationCostCategory, string> = { MATERIAL: "재료비", LABOR: "노무비", EXPENSE: "경비", TRAVEL: "출장비" };

export type ConstructionQuotationItem = { costCategory: QuotationCostCategory; quantity: string | number; unitPrice: string | number | bigint; discountRate: string | number };
export type ConstructionRates = { toolLossRate: string | number; generalAdminRate: string | number; safetyHealthRate: string | number };

function decimalParts(value: string | number) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new RangeError("0 이상의 숫자를 입력해 주세요.");
  const [whole, fraction = ""] = text.split(".");
  return { value: BigInt(whole + fraction), scale: 10n ** BigInt(fraction.length) };
}
function roundDivide(numerator: bigint, denominator: bigint) { return (numerator + denominator / 2n) / denominator; }
function rateAmount(amount: bigint, rate: string | number) { const parsed = decimalParts(rate); return roundDivide(amount * parsed.value, parsed.scale * 100n); }

export function calculateQuotationItemAmount(item: Pick<ConstructionQuotationItem, "quantity" | "unitPrice" | "discountRate">) {
  const quantity = decimalParts(item.quantity), unitPrice = BigInt(item.unitPrice), discount = decimalParts(item.discountRate);
  const baseAmount = roundDivide(quantity.value * unitPrice, quantity.scale);
  const discountAmount = roundDivide(baseAmount * discount.value, discount.scale * 100n);
  return { baseAmount, discountAmount, supplyAmount: baseAmount - discountAmount };
}
export function summarizeQuotationCostCategories(items: ConstructionQuotationItem[]) {
  const amounts: Record<QuotationCostCategory, bigint> = { MATERIAL: 0n, LABOR: 0n, EXPENSE: 0n, TRAVEL: 0n };
  for (const item of items) amounts[item.costCategory] += calculateQuotationItemAmount(item).supplyAmount;
  return { materialAmount: amounts.MATERIAL, laborAmount: amounts.LABOR, expenseAmount: amounts.EXPENSE, travelAmount: amounts.TRAVEL };
}
export const calculateToolLossAmount = (laborAmount: bigint, rate: string | number) => rateAmount(laborAmount, rate);
export const calculateGeneralAdminAmount = (materialAmount: bigint, laborAmount: bigint, rate: string | number) => rateAmount(materialAmount + laborAmount, rate);
export const calculateSafetyHealthAmount = (materialAmount: bigint, laborAmount: bigint, rate: string | number) => rateAmount(materialAmount + laborAmount, rate);
export function calculateConstructionQuotationTotals(items: ConstructionQuotationItem[], rates: ConstructionRates) {
  const categories = summarizeQuotationCostCategories(items);
  const directCostAmount = categories.materialAmount + categories.laborAmount + categories.expenseAmount + categories.travelAmount;
  const toolLossAmount = calculateToolLossAmount(categories.laborAmount, rates.toolLossRate);
  const generalAdminAmount = calculateGeneralAdminAmount(categories.materialAmount, categories.laborAmount, rates.generalAdminRate);
  const safetyHealthAmount = calculateSafetyHealthAmount(categories.materialAmount, categories.laborAmount, rates.safetyHealthRate);
  const taxableAmount = directCostAmount + toolLossAmount + generalAdminAmount + safetyHealthAmount;
  const vatAmount = roundDivide(taxableAmount * 10n, 100n), totalAmount = taxableAmount + vatAmount;
  return { ...categories, directCostAmount, toolLossAmount, generalAdminAmount, safetyHealthAmount, taxableAmount, vatAmount, totalAmount };
}
export function validateConstructionQuotationTotals(stored: Partial<Record<keyof ReturnType<typeof calculateConstructionQuotationTotals>, bigint>>, calculated: ReturnType<typeof calculateConstructionQuotationTotals>) {
  const keys = Object.keys(calculated) as (keyof typeof calculated)[];
  return keys.every((key) => stored[key] === undefined || stored[key] === calculated[key]);
}
export function groupQuotationItemsByCostCategory<T extends { costCategory: QuotationCostCategory }>(items: T[]) {
  return Object.fromEntries(QUOTATION_COST_CATEGORIES.map((category) => [category, items.filter((item) => item.costCategory === category)])) as Record<QuotationCostCategory, T[]>;
}
