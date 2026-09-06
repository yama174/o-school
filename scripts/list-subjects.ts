import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  for (const s of subjects) console.log(JSON.stringify(s.name));
  console.log("total:", subjects.length);
}
main().finally(() => prisma.$disconnect());
