import { db } from "@/lib/db";
import { documents, chunks } from "@/drizzle/schema";
import { embedText } from "@/lib/embed";
import { eq } from "drizzle-orm";

async function main() {
  console.log("1. Insert test document...");
  const [doc] = await db.insert(documents).values({
    title: "TEST",
    type: "Lainnya",
  }).returning();
  console.log("   Doc ID:", doc.id);

  console.log("2. Generate embedding...");
  const emb = await embedText("Ini adalah teks uji coba.");
  console.log("   Embedding length:", emb.length);

  console.log("3. Insert test chunk...");
  try {
    await db.insert(chunks).values({
      documentId: doc.id,
      chapter: "BAB I",
      article: "Pasal 1",
      content: "Ini adalah teks uji coba.",
      embedding: emb,
      page: 1,
    });
    console.log("   ✅ Chunk berhasil disimpan!");
  } catch (err: unknown) {
    const e = err as { message?: string; cause?: unknown };
    console.error("   ❌ Insert gagal:", e.message);
    console.error("   Cause:", e.cause);
  }

  // Cleanup
  await db.delete(documents).where(eq(documents.id, doc.id));
  console.log("4. Test document dihapus.");
}

main().catch(console.error);
