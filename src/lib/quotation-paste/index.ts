export type PasteMode = "append" | "replace";
export type PastedQuotationItem = { productId: null; name: string; specification: string; unit: string; quantity: string; unitPrice: string; discountRate: string; note: string };
export type ParsedPasteRow = PastedQuotationItem & { sourceRow: number; errors: string[] };
const headerWords = new Set(["품명", "규격", "단위", "수량", "단가", "할인율", "비고"]);
function isHeader(columns: string[]) { return columns.slice(0, 4).filter((value) => headerWords.has(value.replace(/\s/g, ""))).length >= 3; }
export function parseQuotationPaste(text: string): ParsedPasteRow[] {
  const sourceLines = text.replace(/\r/g, "").split("\n").map((line, index) => ({ line, sourceRow: index + 1 })).filter(({ line }) => line.trim());
  return sourceLines.filter(({ line }, index) => !(index === 0 && isHeader(line.split("\t").map((value) => value.trim())))).map(({ line, sourceRow }) => {
    const [name = "", specification = "", unit = "", quantity = "", rawUnitPrice = "", rawDiscountRate = "", note = ""] = line.split("\t").map((value) => value.trim());
    const unitPrice = rawUnitPrice.replace(/,/g, ""), discountRate = rawDiscountRate || "0", errors: string[] = [];
    if (!name) errors.push("품명은 필수입니다."); if (!unit) errors.push("단위는 필수입니다.");
    if (!/^\d+(?:\.\d{1,4})?$/.test(quantity) || Number(quantity) <= 0) errors.push("수량은 0보다 큰 숫자여야 합니다.");
    if (!/^\d+$/.test(unitPrice) || !Number.isSafeInteger(Number(unitPrice))) errors.push("단가는 쉼표를 제외한 원 단위 숫자여야 합니다.");
    if (!/^\d+(?:\.\d{1,2})?$/.test(discountRate) || Number(discountRate) > 100) errors.push("할인율은 0~100 사이 숫자여야 합니다.");
    return { sourceRow, productId: null, name, specification, unit, quantity, unitPrice, discountRate, note, errors };
  });
}
export function mergeQuotationPasteItems<T>(existing: T[], pasted: T[], mode: PasteMode): T[] { return mode === "replace" ? [...pasted] : [...existing, ...pasted]; }
