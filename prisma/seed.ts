import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
const categories = ["인건비","외주비","재료비","장비비","소프트웨어 사용료","교통비","출장비","숙박비","식비","회의비","광고비","배송비","소모품비","기타 비용"];
async function main() {
 const email=process.env.ADMIN_EMAIL ?? "admin@example.com",password=process.env.ADMIN_PASSWORD;
 if (!password) throw new Error("ADMIN_PASSWORD 환경변수가 필요합니다.");
 const passwordHash=await hash(password,12);
 const admin=await db.user.upsert({where:{email},update:{passwordHash,name:"관리자",role:Role.ADMIN,isActive:true,deletedAt:null},create:{email,passwordHash,name:"관리자",role:Role.ADMIN}});
 await Promise.all(categories.map((name,i)=>db.expenseCategory.upsert({where:{code:`EXP-${String(i+1).padStart(2,"0")}`},update:{name,sortOrder:i+1},create:{code:`EXP-${String(i+1).padStart(2,"0")}`,name,sortOrder:i+1}})));
 await db.companySetting.upsert({where:{businessNumber:"000-00-00000"},update:{},create:{companyName:"프로젝트 운영 주식회사",businessNumber:"000-00-00000",representativeName:"대표자"}});
 const client=await db.client.upsert({where:{businessNumber:"123-45-67890"},update:{deletedAt:null},create:{clientCode:"C-DEMO-001",companyName:"샘플 고객사",businessNumber:"123-45-67890",representativeName:"김대표",contactName:"이담당",contactPhone:"02-1234-5678",contactEmail:"client@example.com",paymentTerms:"계약금 50%, 잔금 50%",clientType:"CUSTOMER",createdById:admin.id}});
 const products=[{productCode:"SVC-001",name:"웹 서비스 기획",specification:"기획 및 설계",unit:"식",defaultPrice:1500000},{productCode:"SVC-002",name:"프론트엔드 개발",specification:"반응형 웹",unit:"식",defaultPrice:3000000},{productCode:"SVC-003",name:"유지보수",specification:"월간",unit:"월",defaultPrice:500000}];
 await Promise.all(products.map(p=>db.product.upsert({where:{productCode:p.productCode},update:{...p,isActive:true,deletedAt:null},create:{...p,taxType:"TAXABLE"}})));
 const project=await db.project.upsert({where:{projectCode:"P-DEMO-001"},update:{deletedAt:null},create:{projectCode:"P-DEMO-001",projectName:"샘플 홈페이지 구축",clientId:client.id,managerId:admin.id,startDate:new Date("2026-08-01T00:00:00Z"),expectedEndDate:new Date("2026-09-30T00:00:00Z"),contractAmount:5500000,budgetAmount:3000000,status:"IN_PROGRESS"}});
 const category=await db.expenseCategory.findUniqueOrThrow({where:{code:"EXP-03"}});
 await db.expense.upsert({where:{expenseNumber:"E-DEMO-001"},update:{deletedAt:null},create:{expenseNumber:"E-DEMO-001",projectId:project.id,expenseCategoryId:category.id,expenseDate:new Date("2026-08-05T00:00:00Z"),description:"샘플 디자인 리소스",quantity:1,unitPrice:500000,supplyAmount:500000,vatAmount:50000,totalAmount:550000,paymentMethod:"BANK_TRANSFER",evidenceType:"TAX_INVOICE",status:"APPROVED",requestedById:admin.id,approvedById:admin.id,approvedAt:new Date("2026-08-05T00:00:00Z")}});
 await db.payment.upsert({where:{paymentNumber:"R-DEMO-001"},update:{deletedAt:null},create:{paymentNumber:"R-DEMO-001",clientId:client.id,projectId:project.id,paymentDate:new Date("2026-08-03T00:00:00Z"),amount:2750000,paymentType:"ADVANCE",paymentMethod:"계좌이체",confirmedById:admin.id}});
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
