// Voyle — Prisma client singleton
// Uses the LibSQL adapter for Prisma 7+.

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const libsqlClient = createClient({ url: `file:${dbPath}` });
  // @ts-expect-error — Prisma 7 adapter types are mismatched with @libsql/client; runtime works fine.
  const adapter = new PrismaLibSql(libsqlClient);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}