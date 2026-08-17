"use client";

import { useState } from "react";
import { input } from "@/components/common/page";

type Row = { id: string; name: string; ordered: number; prior: number };

export function ReceiptItemsEditor({ items, receiveAll = false }: { items: Row[]; receiveAll?: boolean }) {
  const [rows, setRows] = useState(items.map((item) => {
    const remaining = Math.max(0, item.ordered - item.prior);
    return { ...item, selected: receiveAll && remaining > 0, receivedQuantity: receiveAll ? remaining : 0, acceptedQuantity: receiveAll ? remaining : 0, rejectedQuantity: 0 };
  }));
  const patch = (index: number, key: "receivedQuantity" | "acceptedQuantity" | "rejectedQuantity", value: number) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  const select = (index: number, selected: boolean) => setRows((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    const remaining = Math.max(0, row.ordered - row.prior);
    return { ...row, selected, receivedQuantity: selected ? remaining : 0, acceptedQuantity: selected ? remaining : 0, rejectedQuantity: 0 };
  }));
  const payload = rows.filter((row) => row.selected && row.receivedQuantity > 0).map((row) => ({ purchaseOrderItemId: row.id, receivedQuantity: row.receivedQuantity, acceptedQuantity: row.acceptedQuantity, rejectedQuantity: row.rejectedQuantity }));
  return <>
    <input type="hidden" name="items" value={JSON.stringify(payload)} />
    <table className="w-full text-sm"><thead><tr>{["선택", "품명", "발주수량", "이전 입고", "이번 입고", "누적", "미입고", "합격", "불합격", "입고율"].map((heading) => <th className="p-2 text-left" key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t" key={row.id}>
      <td><input type="checkbox" checked={row.selected} disabled={row.prior >= row.ordered} onChange={(event) => select(index, event.target.checked)} /></td><td>{row.name}</td><td>{row.ordered}</td><td>{row.prior}</td>
      <td><input className={`${input} mt-0 w-24`} disabled={!row.selected} min="0" step="any" type="number" value={row.receivedQuantity} onChange={(event) => patch(index, "receivedQuantity", Number(event.target.value))} /></td>
      <td>{row.prior + row.receivedQuantity}</td><td>{Math.max(0, row.ordered - row.prior - row.receivedQuantity)}</td>
      <td><input className={`${input} mt-0 w-24`} disabled={!row.selected} min="0" step="any" type="number" value={row.acceptedQuantity} onChange={(event) => patch(index, "acceptedQuantity", Number(event.target.value))} /></td>
      <td><input className={`${input} mt-0 w-24`} disabled={!row.selected} min="0" step="any" type="number" value={row.rejectedQuantity} onChange={(event) => patch(index, "rejectedQuantity", Number(event.target.value))} /></td>
      <td>{row.ordered ? Math.min(100, (row.prior + row.receivedQuantity) / row.ordered * 100).toFixed(0) : 0}%</td>
    </tr>)}</tbody></table>
    {receiveAll && <p className="text-sm text-amber-700">모든 미입고 잔량이 선택되었습니다. 저장 전에 수량을 확인해 주세요.</p>}
  </>;
}
