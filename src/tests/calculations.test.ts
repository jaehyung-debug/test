import { describe, expect, it } from "vitest";
import { calculateProjectSummary, calculateQuotationItem } from "@/lib/calculations";
describe("금액 계산", () => {
 it("견적 품목의 할인과 부가세를 정수로 계산한다", () => expect(calculateQuotationItem({quantity:2n,unitPrice:10000n,discountRateBasisPoints:1000n,taxType:"TAXABLE"})).toEqual({baseAmount:20000n,discountAmount:2000n,supplyAmount:18000n,vatAmount:1800n,totalAmount:19800n}));
 it("프로젝트 손익과 미수금을 계산한다", () => expect(calculateProjectSummary(1000000n,600000n,500000n,800000n)).toEqual({remainingBudget:100000n,budgetUsageRate:83.33,receivable:200000n,isOverpaid:false,expectedProfit:400000n,actualProfit:300000n,actualProfitRate:30}));
 it("0원 분모의 비율은 0이다", () => expect(calculateProjectSummary(0n,0n,0n,0n).actualProfitRate).toBe(0));
});
