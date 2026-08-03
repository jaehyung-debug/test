import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
const categories = ["재료비","외주비","인건비","출장비","교통비","숙박비","식비","운반비","소모품비","장비 및 공구비","임차료","통신비","기타"];
async function main() {
 const email=process.env.ADMIN_EMAIL ?? "admin@example.com"; const password=process.env.ADMIN_PASSWORD;
 if (!password) throw new Error("ADMIN_PASSWORD 환경변수가 필요합니다.");
 const passwordHash = await hash(password,12);
 await db.user.upsert({where:{email},update:{passwordHash,name:"관리자",role:Role.ADMIN,isActive:true,deletedAt:null},create:{email,passwordHash,name:"관리자",role:Role.ADMIN}});
 await Promise.all(categories.map((name,i)=>db.expenseCategory.upsert({where:{code:`EXP-${String(i+1).padStart(2,"0")}`},update:{name,sortOrder:i+1},create:{code:`EXP-${String(i+1).padStart(2,"0")}`,name,sortOrder:i+1}})));
 await db.companySetting.upsert({where:{businessNumber:"000-00-00000"},update:{},create:{companyName:"회사명을 설정해 주세요",businessNumber:"000-00-00000",representativeName:"대표자"}});
}
main().finally(()=>db.$disconnect());
