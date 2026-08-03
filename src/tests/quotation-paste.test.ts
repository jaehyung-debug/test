import { describe, expect, it } from "vitest";
import { mergeQuotationPasteItems, parseQuotationPaste } from "@/lib/quotation-paste";
const sample = "품명\t규격\t단위\t수량\t단가\t할인율\t비고\n제어반 제작\t600x800x250\tSET\t1\t3,500,000\t\tPLC 판넬\n현장 시운전\t\t일\t3\t800000\t0\t";
describe("엑셀 견적 품목 붙여넣기", () => {
  it("헤더를 제외하고 탭 데이터, 쉼표 단가와 빈 할인율을 파싱한다", () => { const rows = parseQuotationPaste(sample); expect(rows).toHaveLength(2); expect(rows[0]).toMatchObject({ sourceRow: 2, name: "제어반 제작", unitPrice: "3500000", discountRate: "0", errors: [] }); expect(rows[1]).toMatchObject({ specification: "", note: "", quantity: "3" }); });
  it("잘못된 숫자가 포함된 원본 행 번호와 한글 오류를 반환한다", () => { const [row] = parseQuotationPaste("잘못된 품목\t\t개\tABC\t만원\t120\t"); expect(row.sourceRow).toBe(1); expect(row.errors.join(" ")).toContain("수량"); expect(row.errors.join(" ")).toContain("단가"); expect(row.errors.join(" ")).toContain("할인율"); });
  it("기존 품목 뒤에 추가하거나 전체 교체한다", () => { expect(mergeQuotationPasteItems(["기존"], ["신규1", "신규2"], "append")).toEqual(["기존", "신규1", "신규2"]); expect(mergeQuotationPasteItems(["기존"], ["신규"], "replace")).toEqual(["신규"]); });
});
