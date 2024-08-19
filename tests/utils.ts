import type { Pool } from "pg";
import type { PrismaClient } from "@prisma/client";

// Delete data of tables database between the tests using SQL client
/*export async function resetSQLDB(pg: Pool) {
  await pg.query(
    `
      DELETE FROM message;
      DELETE FROM chat;
      DELETE FROM "user";`
  );
}*/

// Delete data of tables database between the tests using Prisma client
export async function resetORMDB(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
