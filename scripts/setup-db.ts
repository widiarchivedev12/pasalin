/**
 * Setup database: aktifkan ekstensi pgvector, lalu push schema Drizzle.
 * Jalankan SEKALI sebelum ingest pertama.
 *
 * Penggunaan: npx tsx --env-file=.env scripts/setup-db.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const rawSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(rawSql);

  console.log("1️⃣  Mengaktifkan ekstensi pgvector...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  console.log("   ✅ pgvector siap.\n");

  console.log("2️⃣  Membuat tabel documents...");
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE document_type AS ENUM ('UU', 'Perda', 'Kampus', 'Lainnya');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS documents (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      type       document_type NOT NULL,
      source_url TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  console.log("   ✅ Tabel documents siap.\n");

  console.log("3️⃣  Membuat tabel chunks...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chunks (
      id          SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chapter     TEXT,
      article     TEXT,
      content     TEXT NOT NULL,
      embedding   VECTOR(3072),
      page        INTEGER
    )
  `);
  console.log("   ✅ Tabel chunks siap.\n");

  // HNSW/IVFFlat max 2000 dims — gemini-embedding-001 = 3072 dims, skip index
  // Untuk dataset kecil (<1000 chunk) sequential scan cukup cepat
  console.log("4️⃣  Index vector dilewati (3072 dims > limit HNSW 2000 — sequential scan OK untuk MVP).");

  console.log("✅ Setup selesai! Database siap digunakan.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});
