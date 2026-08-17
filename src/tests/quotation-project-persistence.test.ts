import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const stamp = Date.now();
let userId = "", clientId = "", quotationId = "", projectId = "";

describe("견적서 발행과 프로젝트 등록 영속성", () => {
  beforeAll(async () => {
    userId = (await db.user.findFirstOrThrow()).id;
    clientId = (await db.client.create({ data: { clientCode: `QP-${stamp}`, companyName: "견적 프로젝트 테스트", businessNumber: `QP-${stamp}`, createdById: userId } })).id;
    quotationId = (await db.quotation.create({ data: { quotationNumber: `QPW-${stamp}`, revision: 1, clientId, projectName: "자동 생성 프로젝트", title: "발행 테스트", quotationDate: new Date(), subtotal: 1_000_000, discountAmount: 0, taxableAmount: 1_000_000, vatAmount: 100_000, totalAmount: 1_100_000, createdById: userId } })).id;
  });
  it("발행자와 발행일을 명시적으로 저장한다", async () => {
    const issued = await db.quotation.update({ where: { id: quotationId }, data: { issuedAt: new Date(), issuedById: userId, status: "SENT" } });
    expect(issued.issuedAt).not.toBeNull(); expect(issued.issuedById).toBe(userId);
  });
  it("견적 계약금액과 연결을 프로젝트에 복사한다", async () => {
    const project = await db.project.create({ data: { projectCode: `PP-${stamp}`, projectName: "자동 생성 프로젝트", clientId, quotationId, managerId: userId, startDate: new Date(), contractAmount: 1_000_000, contractSupplyAmount: 1_000_000, contractVatAmount: 100_000, contractTotalAmount: 1_100_000, quotationNumberSnapshot: `QPW-${stamp}`, quotationRevisionSnapshot: 1, budgetAmount: 0 } });
    projectId = project.id; expect(project.clientId).toBe(clientId); expect(Number(project.contractSupplyAmount)).toBe(1_000_000); expect(Number(project.contractVatAmount)).toBe(100_000); expect(Number(project.contractTotalAmount)).toBe(1_100_000);
  });
  it("동일 견적서의 프로젝트 중복 생성을 DB에서도 막는다", async () => {
    await expect(db.project.create({ data: { projectCode: `PP-DUP-${stamp}`, projectName: "중복", clientId, quotationId, managerId: userId, startDate: new Date(), contractAmount: 0, budgetAmount: 0 } })).rejects.toMatchObject({ code: "P2002" });
  });
  afterAll(async () => { if (projectId) await db.project.delete({ where: { id: projectId } }); if (quotationId) await db.quotation.delete({ where: { id: quotationId } }); if (clientId) await db.client.delete({ where: { id: clientId } }); await db.$disconnect(); });
});
