/**
 * Eval script — ukur kualitas retrieval dan faithfulness
 *
 * Cara pakai:
 *   npm run eval
 *   npm run eval -- --suite data/eval-suite.json
 *
 * Format eval-suite.json:
 * [
 *   {
 *     "question": "Apa sanksi Pasal 27 UU ITE?",
 *     "expected_articles": ["Pasal 27", "Pasal 45"],
 *     "expected_keywords": ["pidana", "penjara", "denda"]
 *   },
 *   ...
 * ]
 *
 * Metrik yang diukur:
 *   - Retrieval hit rate: apakah pasal yang diharapkan masuk dalam top-5
 *   - Faithfulness: apakah jawaban tidak menyebut pasal di luar konteks
 *   - Safe refusal: untuk pertanyaan di luar dokumen, apakah bot menolak
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { retrieveChunks } from "@/lib/retrieve";
import { buildSystemPrompt } from "@/lib/prompt";

// ─── Argumen CLI ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const suitePath =
  getArg("suite") ?? "data/eval-suite.json";

// ─── Tipe ─────────────────────────────────────────────────────────────────────

interface EvalCase {
  question: string;
  expected_articles?: string[];
  expected_keywords?: string[];
  out_of_domain?: boolean;
}

interface EvalResult extends EvalCase {
  retrieved_articles: string[];
  hit: boolean;
  answer: string;
  faithful: boolean;
  refused_correctly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkHit(
  retrieved: { article: string | null }[],
  expected: string[]
): boolean {
  if (!expected || expected.length === 0) return true;
  const retrievedStr = retrieved
    .map((r) => r.article ?? "")
    .join(" ")
    .toLowerCase();
  return expected.some((e) => retrievedStr.includes(e.toLowerCase()));
}

function checkFaithfulness(answer: string, context: string): boolean {
  // Deteksi pola [nomor] yang disebut dalam jawaban
  const citedNums = [...answer.matchAll(/\[(\d+)\]/g)].map((m) =>
    parseInt(m[1])
  );
  const maxCtx = context.split("\n").filter((l) => l.startsWith("[")).length;
  // Tidak ada nomor yang di-cite di luar range konteks
  return citedNums.every((n) => n >= 1 && n <= maxCtx);
}

function checkRefusal(answer: string): boolean {
  const refusalPhrases = [
    "tidak ditemukan",
    "tidak menemukan",
    "tidak ada informasi",
    "tidak tersedia",
    "tidak dapat menemukan",
  ];
  return refusalPhrases.some((p) => answer.toLowerCase().includes(p));
}

// ─── Main eval ────────────────────────────────────────────────────────────────

async function runEval() {
  const suite: EvalCase[] = JSON.parse(
    readFileSync(path.resolve(suitePath), "utf-8")
  );

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  const model = groq(process.env.MODEL_ID ?? "llama-3.3-70b-versatile");

  const results: EvalResult[] = [];
  let hits = 0;
  let faithful = 0;
  let correctRefusals = 0;
  let refusalCases = 0;

  console.log(`\n🧪 Evaluasi ${suite.length} pertanyaan...\n`);

  for (let i = 0; i < suite.length; i++) {
    const c = suite[i];
    process.stdout.write(`[${i + 1}/${suite.length}] ${c.question.slice(0, 60)}...\r`);

    const retrieved = await retrieveChunks(c.question, 5);
    const systemPrompt = buildSystemPrompt(retrieved);

    const { text: answer } = await generateText({
      model,
      system: systemPrompt,
      prompt: c.question,
    });

    const hit = checkHit(retrieved, c.expected_articles ?? []);
    const faithfulOk = checkFaithfulness(answer, systemPrompt);
    const isRefusal = c.out_of_domain === true;
    const refusedOk = isRefusal ? checkRefusal(answer) : undefined;

    if (hit) hits++;
    if (faithfulOk) faithful++;
    if (isRefusal) {
      refusalCases++;
      if (refusedOk) correctRefusals++;
    }

    results.push({
      ...c,
      retrieved_articles: retrieved.map((r) => r.article ?? ""),
      hit,
      answer,
      faithful: faithfulOk,
      refused_correctly: refusedOk,
    });
  }

  // ─── Laporan ─────────────────────────────────────────────────────────────

  const total = suite.length;
  const hitRate = ((hits / total) * 100).toFixed(1);
  const faithfulRate = ((faithful / total) * 100).toFixed(1);
  const refusalRate =
    refusalCases > 0
      ? ((correctRefusals / refusalCases) * 100).toFixed(1)
      : "N/A";

  console.log("\n\n──────────────────────────────────────────");
  console.log("  HASIL EVALUASI PASALIN");
  console.log("──────────────────────────────────────────");
  console.log(`  Total pertanyaan : ${total}`);
  console.log(`  Retrieval hit rate : ${hitRate}% (target >80%)`);
  console.log(`  Faithfulness       : ${faithfulRate}% (target 100%)`);
  console.log(`  Safe refusal       : ${refusalRate}% (target >90%)`);
  console.log("──────────────────────────────────────────\n");

  // Kasus gagal
  const failures = results.filter((r) => !r.hit || !r.faithful);
  if (failures.length > 0) {
    console.log(`⚠️  ${failures.length} kasus perlu perhatian:\n`);
    for (const f of failures) {
      console.log(`  • [${!f.hit ? "MISS" : ""}${!f.faithful ? " UNFAITHFUL" : ""}] ${f.question}`);
      if (!f.hit) {
        console.log(`    Dicari: ${f.expected_articles?.join(", ")}`);
        console.log(`    Ditemukan: ${f.retrieved_articles.slice(0, 3).join(", ")}`);
      }
    }
  }

  // Simpan hasil ke JSON
  const outPath = `data/eval-result-${Date.now()}.json`;
  writeFileSync(
    path.resolve(outPath),
    JSON.stringify({ summary: { hitRate, faithfulRate, refusalRate }, results }, null, 2)
  );
  console.log(`\n📄 Hasil lengkap disimpan ke: ${outPath}`);
}

runEval().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
