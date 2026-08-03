export function won(value: number | bigint | { toString(): string }) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}
export function date(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date(value));
}
export function inputDate(value: Date | null | undefined) { return value ? value.toISOString().slice(0,10) : ""; }
