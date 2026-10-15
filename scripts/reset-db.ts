import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  console.log("Dropping tabel lama...");
  await db.execute(sql`DROP TABLE IF EXISTS chunks CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS documents CASCADE`);
  await db.execute(sql`DROP TYPE IF EXISTS document_type CASCADE`);
  console.log("✅ Tabel dihapus.");
}

main().catch(console.error);
