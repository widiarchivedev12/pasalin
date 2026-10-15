/**
 * Pipeline ingest: PDF → ekstraksi teks → chunking per pasal → embedding → simpan ke pgvector
 *
 * Cara pakai:
 *   npm run ingest -- --file data/uu-ite.pdf --title "UU ITE No. 19 Tahun 2016" --type UU --source "https://peraturan.go.id/..."
 *   npm run ingest -- --file data/pedoman-akademik.pdf --title "Pedoman Akademik 2024" --type Kampus
 */

import { readFileSync } from "fs";
import path from "path";
import { extractText } from "unpdf";
import { db } from "@/lib/db";
import { documents, chunks } from "@/drizzle/schema";
import { embedTexts } from "@/lib/embed";

// ─── Argumen CLI ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const filePath = getArg("file");
const title = getArg("title");
const docType = (getArg("type") ?? "Lainnya") as
  | "UU"
  | "Perda"
  | "Kampus"
  | "Lainnya";
const sourceUrl = getArg("source");

if (!filePath || !title) {
  console.error("Penggunaan: npm run ingest -- --file <path> --title <judul> [--type UU|Perda|Kampus|Lainnya] [--source <url>]");
  process.exit(1);
}

// ─── Ekstraksi teks dari PDF ──────────────────────────────────────────────────

async function extractPdfText(
  filePath: string
): Promise<{ text: string; pageTexts: string[] }> {
  const buffer = readFileSync(path.resolve(filePath));
  const uint8 = new Uint8Array(buffer);
  // mergePages: false → text adalah string[] (satu elemen per halaman)
  const { text: pageTexts } = await extractText(uint8, { mergePages: false });
  const text = (pageTexts as string[]).join("\n");
  return { text, pageTexts: pageTexts as string[] };
}

// ─── Chunking per pasal ────────────────────────────────────────────────────────

interface PasalChunk {
  chapter: string | null;
  article: string;
  content: string;
  page: number | null;
}

const BAB_REGEX = /^(BAB\s+[IVXLCDM]+\b.*)/im;
const PASAL_REGEX = /^(Pasal\s+\d+[A-Z]?)\b/im;
const AYAT_REGEX = /^\s*\((\d+)\)/m;

function chunkByPasal(fullText: string, pageTexts: string[]): PasalChunk[] {
  const lines = fullText.split("\n");
  const chunks: PasalChunk[] = [];

  let currentChapter: string | null = null;
  let currentArticle: string | null = null;
  let currentLines: string[] = [];

  function flush() {
    if (currentArticle && currentLines.length > 0) {
      const content = currentLines.join("\n").trim();
      if (content.length > 20) {
        const page = findPage(content, pageTexts);
        chunks.push({
          chapter: currentChapter,
          article: currentArticle,
          content,
          page,
        });
      }
    }
    currentLines = [];
  }

  for (const line of lines) {
    const babMatch = line.match(BAB_REGEX);
    if (babMatch) {
      flush();
      currentChapter = babMatch[1].trim();
      continue;
    }

    const pasalMatch = line.match(PASAL_REGEX);
    if (pasalMatch) {
      flush();
      currentArticle = pasalMatch[1].trim();
      currentLines.push(line);
      continue;
    }

    if (currentArticle) {
      currentLines.push(line);
    }
  }

  flush();

  // Pecah pasal sangat panjang (>2000 karakter) per ayat
  const result: PasalChunk[] = [];
  for (const chunk of chunks) {
    if (chunk.content.length <= 2000) {
      result.push(chunk);
      continue;
    }

    const ayatParts = chunk.content.split(/(?=^\s*\(\d+\))/m);
    let buffer = "";
    let ayatNum = 0;

    for (const part of ayatParts) {
      const ayatMatch = part.match(AYAT_REGEX);
      if (ayatMatch && buffer.length > 200) {
        result.push({
          ...chunk,
          article: `${chunk.article} ayat (${ayatNum})`,
          content: buffer.trim(),
        });
        buffer = part;
        ayatNum = parseInt(ayatMatch[1]);
      } else {
        buffer += "\n" + part;
        if (ayatMatch) ayatNum = parseInt(ayatMatch[1]);
      }
    }
    if (buffer.trim().length > 20) {
      result.push({
        ...chunk,
        article: `${chunk.article} ayat (${ayatNum})`,
        content: buffer.trim(),
      });
    }
  }

  return result;
}

function findPage(content: string, pageTexts: string[]): number | null {
  const snippet = content.slice(0, 80).replace(/\s+/g, " ").trim();
  for (let i = 0; i < pageTexts.length; i++) {
    if (pageTexts[i].includes(snippet)) return i + 1;
  }
  return null;
}

// ─── Simpan ke database ────────────────────────────────────────────────────────

async function ingest() {
  console.log(`📄 Memproses: ${filePath}`);

  const { text, pageTexts } = await extractPdfText(filePath!);
  console.log(`   Teks diekstrak: ${text.length.toLocaleString()} karakter`);

  const pasalChunks = chunkByPasal(text, pageTexts);
  console.log(`   Chunk pasal ditemukan: ${pasalChunks.length}`);

  if (pasalChunks.length === 0) {
    console.error("   ⚠️  Tidak ada pasal ditemukan. Periksa format PDF.");
    process.exit(1);
  }

  // Simpan dokumen
  const [doc] = await db
    .insert(documents)
    .values({ title: title!, type: docType, sourceUrl })
    .returning();
  console.log(`   Dokumen disimpan dengan ID: ${doc.id}`);

  // Embed dan simpan chunks dalam batch
  // Gemini free tier: 100 requests/menit. Setiap item = 1 request.
  // Batch 20 item = 20 requests → maks 5 batch/menit → jeda 13 detik antar batch.
  const BATCH = 20;
  const RATE_LIMIT_DELAY_MS = 13_000;
  let saved = 0;

  for (let i = 0; i < pasalChunks.length; i += BATCH) {
    const batch = pasalChunks.slice(i, i + BATCH);
    const embeddings = await embedTexts(batch.map((c) => c.content));

    await db.insert(chunks).values(
      batch.map((c, j) => ({
        documentId: doc.id,
        chapter: c.chapter,
        article: c.article,
        content: c.content,
        embedding: embeddings[j],
        page: c.page,
      }))
    );

    saved += batch.length;
    const pct = ((saved / pasalChunks.length) * 100).toFixed(0);
    process.stdout.write(`\r   Progress: ${saved}/${pasalChunks.length} chunk (${pct}%)`);

    // Jeda antar batch agar tidak kena rate limit Gemini free tier
    if (i + BATCH < pasalChunks.length) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }

  console.log(`\n✅ Ingest selesai: ${saved} chunk berhasil disimpan.`);
}

ingest().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
