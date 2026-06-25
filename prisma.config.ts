// Prisma 7 config — uses adapter-based connection instead of datasource url in schema.
// See https://pris.ly/d/config-datasource
import path from "node:path";
import { defineConfig } from "prisma/config";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const dbUrl = `file:${dbPath}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  // @ts-expect-error — Prisma 7's PrismaConfig type doesn't include `migrate` yet,
  // but the runtime accepts it. This is the documented pattern for adapter-based connections.
  migrate: {
    url: dbUrl,
    adapter: async () => {
      const { PrismaLibSql } = await import("@prisma/adapter-libsql");
      const { createClient } = await import("@libsql/client");
      const client = createClient({ url: dbUrl });
      // @ts-expect-error — Prisma 7 adapter types are mismatched with @libsql/client; runtime works fine.
      return new PrismaLibSql(client);
    },
  },
});