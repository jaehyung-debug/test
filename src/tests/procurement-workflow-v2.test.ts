import { describe, expect, it } from "vitest";
import { calculatePurchaseLine, calculateReceivedAmount, canExecuteDisbursement, purchaseOrderStatusFromReceipts, summarizeDisbursements } from "@/features/procurement/calculations";
import { parseProcurementPaste } from "@/lib/procurement-paste";

describe("procurement workflow v2", () => {
  it("parses supplier quotation spreadsheet rows and skips the header", () => {
    const rows = parseProcurementPaste("MAKER\t품목/모델\t품명\t규격\t단위\t수량\t단가\t납기일\t비고\nLS ELECTRIC\tXGK-CPUH\tPLC CPU\t고성능 CPU\tEA\t1.5\t1,500,000\t2026-08-30\t현장용");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ maker: "LS ELECTRIC", modelName: "XGK-CPUH", quantity: 1.5, unitPrice: 1_500_000, deliveryDate: "2026-08-30" });
  });

  it("recalculates quotation lines on the server formula", () => {
    expect(calculatePurchaseLine(4, 180_000)).toEqual({ supplyAmount: 720_000, vatAmount: 72_000, totalAmount: 792_000 });
  });

  it("caps received purchase value at the ordered quantity", () => {
    expect(calculateReceivedAmount([{ orderedQuantity: 10, unitPrice: 1_000, receivedQuantity: 12 }])).toBe(11_000);
  });

  it("transitions partial, received and inspected statuses", () => {
    expect(purchaseOrderStatusFromReceipts(10, 2, 2)).toBe("PARTIALLY_RECEIVED");
    expect(purchaseOrderStatusFromReceipts(10, 10, 8)).toBe("RECEIVED");
    expect(purchaseOrderStatusFromReceipts(10, 10, 10)).toBe("INSPECTED");
  });

  it("requires receipt and inspection triggers before payment", () => {
    expect(canExecuteDisbursement({ trigger: "AFTER_FULL_RECEIPT", orderApproved: true, ordered: 10, received: 9, accepted: 9 }).allowed).toBe(false);
    expect(canExecuteDisbursement({ trigger: "AFTER_INSPECTION", orderApproved: true, ordered: 10, received: 10, accepted: 10 }).allowed).toBe(true);
  });

  it("summarizes split payments and ignores rejected plans", () => {
    const summary = summarizeDisbursements(1_100_000, [{ status: "EXECUTED", totalAmount: 330_000 }, { status: "PLANNED", totalAmount: 770_000 }, { status: "REJECTED", totalAmount: 99_000 }]);
    expect(summary).toMatchObject({ plannedAmount: 1_100_000, executedAmount: 330_000, remainingAmount: 770_000, status: "일부 지급", overpaid: false });
  });
});
