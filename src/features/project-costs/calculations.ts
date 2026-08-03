import { parseQuantity } from "@/lib/calculations";
export type ExpenseAmountInputTypeValue = "SUPPLY" | "TOTAL";
const roundDiv = (value: bigint, divisor: bigint) => (value + divisor / 2n) / divisor;
export function calculateExpenseAmounts(input: { quantity: string | number; unitPrice: number; amountInputType: ExpenseAmountInputTypeValue; vatRate: 0 | 10 }) {
  if (!Number.isSafeInteger(input.unitPrice) || input.unitPrice < 0) throw new RangeError("단가는 원 단위로 입력해 주세요.");
  const quantity = parseQuantity(input.quantity); if (quantity <= 0n) throw new RangeError("수량은 0보다 커야 합니다.");
  const enteredAmount = roundDiv(quantity * BigInt(input.unitPrice), 10000n);
  const supplyAmount = input.amountInputType === "TOTAL" && input.vatRate === 10 ? roundDiv(enteredAmount * 10n, 11n) : enteredAmount;
  const vatAmount = input.vatRate === 10 ? (input.amountInputType === "TOTAL" ? enteredAmount - supplyAmount : roundDiv(supplyAmount, 10n)) : 0n;
  return { supplyAmount: Number(supplyAmount), vatAmount: Number(vatAmount), totalAmount: Number(supplyAmount + vatAmount) };
}
export type CostStatus = "DRAFT" | "APPROVAL_REQUESTED" | "APPROVED" | "REJECTED" | "PAID" | "CANCELED";
export type CostSummaryExpense = { status: CostStatus; supplyAmount: number | { toString(): string }; vatAmount: number | { toString(): string }; totalAmount: number | { toString(): string }; deletedAt?: Date | null };
export function calculateProjectCostSummary(contractAmount: number, budgetAmount: number, expenses: CostSummaryExpense[]) {
  const valid = expenses.filter((expense) => !expense.deletedAt && expense.status !== "REJECTED" && expense.status !== "CANCELED");
  const actualCost = valid.filter((expense) => expense.status === "APPROVED" || expense.status === "PAID").reduce((sum, expense) => sum + Number(expense.supplyAmount), 0);
  const plannedCost = valid.filter((expense) => expense.status === "DRAFT" || expense.status === "APPROVAL_REQUESTED").reduce((sum, expense) => sum + Number(expense.supplyAmount), 0);
  const paidAmount = valid.filter((expense) => expense.status === "PAID").reduce((sum, expense) => sum + Number(expense.totalAmount), 0);
  const vatAmount = valid.reduce((sum, expense) => sum + Number(expense.vatAmount), 0), expectedTotalCost = actualCost + plannedCost, remainingBudget = budgetAmount - actualCost;
  return { actualCost, plannedCost, paidAmount, vatAmount, remainingBudget, expectedTotalCost, budgetUsageRate: budgetAmount === 0 ? 0 : actualCost * 100 / budgetAmount, expectedProfit: contractAmount - budgetAmount, currentExpectedProfit: contractAmount - expectedTotalCost, isOverBudget: actualCost > budgetAmount };
}
