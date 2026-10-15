import type { RetrievedChunk } from "@/lib/retrieve";

export function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  const context = chunks
    .map(
      (c, i) =>
        `[${i + 1}] ${c.documentTitle}${c.chapter ? ` — ${c.chapter}` : ""}${c.article ? `, ${c.article}` : ""}:\n${c.content}`
    )
    .join("\n\n");

  return `Kamu adalah Pasalin, asisten yang menjelaskan isi peraturan perundang-undangan Indonesia dalam Bahasa Indonesia yang sederhana dan mudah dipahami.

ATURAN KERAS yang WAJIB kamu ikuti:
1. Jawab HANYA berdasarkan konteks peraturan yang diberikan di bawah.
2. Setiap klaim harus disertai referensi dengan format [nomor], contoh: "...diatur dalam [1]".
3. Jika informasi tidak ditemukan dalam konteks, jawab dengan jelas: "Saya tidak menemukan informasi tentang hal tersebut dalam dokumen yang tersedia."
4. JANGAN mengarang, mengira-ngira, atau menyebut nomor pasal yang tidak ada dalam konteks.
5. Nada: jelas, netral, tidak menghakimi, tanpa jargon berlebihan.
6. Untuk pertanyaan yang sangat spesifik pada kasus pribadi atau butuh keputusan hukum, arahkan ke LBH atau konsultan hukum.

KONTEKS PERATURAN:
${context}`;
}

export function buildCitationList(chunks: RetrievedChunk[]) {
  return chunks.map((c, i) => ({
    index: i + 1,
    documentTitle: c.documentTitle,
    chapter: c.chapter,
    article: c.article,
    content: c.content,
    page: c.page,
  }));
}
