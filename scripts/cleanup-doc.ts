import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const args = process.argv.slice(2);
const idx = args.indexOf("--id");
const id = idx !== -1 ? parseInt(args[idx + 1]) : null;

async function main() {
  if (!id) {
    console.error("Penggunaan: npx tsx --env-file=.env scripts/cleanup-doc.ts --id <id>");
    process.exit(1);
  }

  const [deleted] = await db.delete(documents).where(eq(documents.id, id)).returning();
  if (deleted) {
    console.log(`✅ Dokumen ID ${id} ("${deleted.title}") berhasil dihapus.`);
  } else {
    console.log(`⚠️  Dokumen ID ${id} tidak ditemukan.`);
  }
}

main().catch(console.error);
