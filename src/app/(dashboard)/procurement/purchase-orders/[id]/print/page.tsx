import Image from "next/image";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/documents/print-button";
import { createSupplierSnapshot, loadSupplierSnapshot, resolveSupplierSnapshotImages } from "@/lib/document-export/company-profile";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.purchaseOrder.findFirst({ where: { id, deletedAt: null }, include: { supplier: true, sourceQuotation: true, sourceOrder: true, project: true, orderedBy: true, issuerSupplierProfile: true, items: { orderBy: { sortOrder: "asc" } } } });
  if (!order) notFound();
  const stored = loadSupplierSnapshot(order.issuerSnapshot);
  const issuer = stored ? resolveSupplierSnapshotImages(stored, order.issuerSupplierProfile, order.status === "DRAFT") : order.issuerSupplierProfile ? createSupplierSnapshot(order.issuerSupplierProfile) : null;
  const logoUrl = order.showIssuerLogo ? issuer?.logoUrl : null;
  const sealUrl = order.showIssuerSeal ? issuer?.sealUrl : null;
  return <main className="mx-auto min-h-[297mm] max-w-[210mm] bg-white p-10 text-[11px] text-black print:p-0">
    <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
    <header className="relative mb-5 min-h-16">{logoUrl && <Image className="absolute left-0 top-0 h-auto max-h-[18mm] w-auto max-w-[45mm] object-contain" alt="회사 로고" width={280} height={100} src={logoUrl} unoptimized />}<h1 className="text-center text-3xl font-bold tracking-[1em]">발 주 서</h1></header>
    <div className="mb-4 grid grid-cols-3 border text-sm"><p className="p-2">발주번호 <b>{order.purchaseOrderNumber}</b></p><p className="border-l p-2">발주일 <b>{order.orderDate.toISOString().slice(0, 10)}</b></p><p className="border-l p-2">프로젝트 <b>{order.project?.projectName ?? "-"}</b></p><p className="border-t p-2">원본 견적번호 <b>{order.sourceQuotation ? `${order.sourceQuotation.quotationNumber} Rev.${order.sourceQuotation.revision}` : "-"}</b></p><p className="border-l border-t p-2">오더번호 <b>{order.sourceOrder?.orderNumber ?? "-"}</b></p><p className="border-l border-t p-2">프로젝트번호 <b>{order.project?.projectCode ?? "-"}</b></p></div>
    <div className="grid grid-cols-2"><Info title="수신 공급업체" rows={[["상호", order.supplier.companyName], ["사업자번호", order.supplier.businessNumber], ["대표자", order.supplier.representativeName], ["담당자", order.supplier.purchaseContactName ?? order.supplier.contactName], ["전화", order.supplier.purchaseContactPhone ?? order.supplier.contactPhone], ["이메일", order.supplier.purchaseContactEmail ?? order.supplier.contactEmail], ["주소", order.supplier.address]]} /><div className="relative"><Info title="발주자" rows={[["상호", issuer?.companyName], ["사업자번호", issuer?.businessNumber], ["대표자", issuer?.representativeName], ["담당자", issuer?.documentManagerName || order.orderedBy.name], ["전화", issuer?.documentManagerPhone || issuer?.phone], ["이메일", issuer?.documentManagerEmail || issuer?.email], ["주소", [issuer?.address, issuer?.detailedAddress].filter(Boolean).join(" ")]]} />{sealUrl && <Image className="absolute bottom-2 right-3 h-auto max-h-[26mm] w-[26mm] object-contain" alt="회사 직인" width={120} height={120} src={sealUrl} unoptimized />}</div></div>
    <table className="mt-5 w-full border-collapse"><thead className="table-header-group"><tr>{["#", "MAKER", "품목/모델", "품명", "규격", "단위", "수량", "단가", "공급가액", "부가세", "합계", "납기일", "비고"].map((heading) => <th className="border p-1" key={heading}>{heading}</th>)}</tr></thead><tbody>{order.items.map((item) => <tr className="break-inside-avoid" key={item.id}><td className="border p-1">{item.sortOrder}</td><td className="border p-1">{item.maker}</td><td className="border p-1">{item.modelName ?? item.itemCode}</td><td className="border p-1">{item.name}</td><td className="border p-1">{item.specification}</td><td className="border p-1">{item.unit}</td><td className="border p-1 text-right">{Number(item.orderedQuantity).toLocaleString()}</td><td className="border p-1 text-right">{Number(item.unitPrice).toLocaleString()}</td><td className="border p-1 text-right">{Number(item.supplyAmount).toLocaleString()}</td><td className="border p-1 text-right">{Number(item.vatAmount).toLocaleString()}</td><td className="border p-1 text-right">{Number(item.totalAmount).toLocaleString()}</td><td className="border p-1">{item.requestedDeliveryDate?.toISOString().slice(0, 10)}</td><td className="border p-1">{item.note}</td></tr>)}</tbody></table>
    <div className="ml-auto mt-4 w-72 space-y-1 border p-3 text-right text-sm"><p>공급가액 {Number(order.subtotal).toLocaleString()}원</p><p>부가세 {Number(order.vatAmount).toLocaleString()}원</p><p className="text-lg font-bold">총합계 {Number(order.totalAmount).toLocaleString()}원</p></div>
    <div className="mt-5 border p-3"><p>납품장소: {order.deliveryPlace ?? "-"}</p><p>납기조건: {order.deliveryDeadlineDate?.toISOString().slice(0, 10) ?? "협의"}</p><p>결제조건: {order.paymentTerms ?? "-"}</p><p>특기사항: {order.note ?? "-"}</p></div>
    <style>{`@page{size:A4 portrait;margin:12mm}@media print{body{background:white}.fixed,aside,.print-hidden{display:none!important}main{margin:0!important}}`}</style>
  </main>;
}

function Info({ title, rows }: { title: string; rows: Array<[string, string | null | undefined]> }) { return <section className="border"><h2 className="border-b bg-slate-100 p-2 text-center font-bold">{title}</h2>{rows.map(([key, value]) => <div className="grid grid-cols-[75px_1fr] border-b last:border-b-0" key={key}><b className="border-r p-1">{key}</b><span className="p-1">{value ?? ""}</span></div>)}</section>; }
