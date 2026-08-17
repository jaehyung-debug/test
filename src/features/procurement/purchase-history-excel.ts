import ExcelJS from "exceljs";

export type PurchaseHistoryExportOrder = {
  purchaseOrderNumber: string; orderDate: Date; supplierCode: string; supplierName: string; businessNumber: string;
  projectCode: string; projectName: string; quotationNumber: string; orderNumber: string; subtotal: number; vatAmount: number;
  totalAmount: number; receivedAmount: number; paidAmount: number; status: string;
  items: Array<{ maker: string; modelName: string; name: string; quantity: number; unitPrice: number; totalAmount: number }>;
  payments: Array<{ number: string; type: string; status: string; plannedDate: Date | null; executedDate: Date | null; totalAmount: number }>;
};

export async function buildPurchaseHistoryWorkbook(orders: PurchaseHistoryExportOrder[], filters: string) {
  const workbook = new ExcelJS.Workbook();
  const sheets = ["공급업체별 요약", "프로젝트별 요약", "발주서별 상세", "품목별 상세", "대금집행 상세"].map((name) => workbook.addWorksheet(name, { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } }));
  for (const sheet of sheets) { sheet.views = [{ showGridLines: false }]; sheet.addRow(["필터", filters]); }
  const supplierMap = aggregate(orders, (order) => `${order.supplierCode}\t${order.supplierName}\t${order.businessNumber}`);
  addTable(sheets[0], ["공급업체 코드", "공급업체명", "사업자번호", "발주 건수", "공급가액", "부가세", "발주 합계", "입고금액", "실제 지급액", "미지급액"], [...supplierMap].map(([key, value]) => [...key.split("\t"), value.count, value.subtotal, value.vat, value.total, value.received, value.paid, value.total - value.paid]));
  const projectMap = aggregate(orders, (order) => `${order.projectCode}\t${order.projectName}\t${order.quotationNumber}\t${order.orderNumber}`);
  addTable(sheets[1], ["프로젝트 코드", "프로젝트명", "원본 견적번호", "오더번호", "발주 건수", "발주금액", "입고금액", "지급액", "미지급액"], [...projectMap].map(([key, value]) => [...key.split("\t"), value.count, value.total, value.received, value.paid, value.total - value.paid]));
  addTable(sheets[2], ["발주일", "발주번호", "공급업체", "프로젝트", "원본 견적번호", "오더번호", "공급가액", "부가세", "합계", "입고금액", "지급액", "미지급액", "상태"], orders.map((order) => [order.orderDate, order.purchaseOrderNumber, order.supplierName, order.projectName, order.quotationNumber, order.orderNumber, order.subtotal, order.vatAmount, order.totalAmount, order.receivedAmount, order.paidAmount, order.totalAmount - order.paidAmount, order.status]));
  addTable(sheets[3], ["발주번호", "공급업체", "MAKER", "품목/모델", "품명", "수량", "단가", "합계"], orders.flatMap((order) => order.items.map((item) => [order.purchaseOrderNumber, order.supplierName, item.maker, item.modelName, item.name, item.quantity, item.unitPrice, item.totalAmount])));
  addTable(sheets[4], ["발주번호", "대금집행번호", "구분", "상태", "예정일", "집행일", "금액"], orders.flatMap((order) => order.payments.map((payment) => [order.purchaseOrderNumber, payment.number, payment.type, payment.status, payment.plannedDate, payment.executedDate, payment.totalAmount])));
  return workbook;
}

function aggregate(orders: PurchaseHistoryExportOrder[], keyFor: (order: PurchaseHistoryExportOrder) => string) { const map = new Map<string, { count: number; subtotal: number; vat: number; total: number; received: number; paid: number }>(); for (const order of orders) { const key = keyFor(order); const row = map.get(key) ?? { count: 0, subtotal: 0, vat: 0, total: 0, received: 0, paid: 0 }; row.count++; row.subtotal += order.subtotal; row.vat += order.vatAmount; row.total += order.totalAmount; row.received += order.receivedAmount; row.paid += order.paidAmount; map.set(key, row); } return map; }
function addTable(sheet: any, headers: string[], rows: unknown[][]) { const header = sheet.addRow(headers); header.font = { bold: true }; for (const row of rows) sheet.addRow(row); sheet.eachRow((row: any, rowNumber: number) => row.eachCell((cell: any) => { if (cell.value instanceof Date) cell.numFmt = "yyyy-mm-dd"; if (typeof cell.value === "number") cell.numFmt = "#,##0"; if (rowNumber === sheet.rowCount) cell.font = { ...cell.font }; })); sheet.columns.forEach((column: any) => { column.width = Math.min(35, Math.max(12, ...column.values.map((value: unknown) => String(value ?? "").length + 2))); }); sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: headers.length } }; }
