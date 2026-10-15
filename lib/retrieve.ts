import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chunks, documents } from "@/drizzle/schema";
import { embedText } from "@/lib/embed";

export interface RetrievedChunk {
  id: number;
  documentTitle: string;
  chapter: string | null;
  article: string | null;
  content: string;
  page: number | null;
  similarity: number;
}

export async function retrieveChunks(
  query: string,
  topK = 5,
  documentId?: number
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const rows = await db
    .select({
      id: chunks.id,
      documentTitle: documents.title,
      chapter: chunks.chapter,
      article: chunks.article,
      content: chunks.content,
      page: chunks.page,
      similarity: sql<number>`1 - (${chunks.embedding} <=> ${embeddingStr}::vector)`,
    })
    .from(chunks)
    .innerJoin(documents, sql`${chunks.documentId} = ${documents.id}`)
    .where(
      documentId
        ? sql`${chunks.documentId} = ${documentId}`
        : sql`true`
    )
    .orderBy(sql`${chunks.embedding} <=> ${embeddingStr}::vector`)
    .limit(topK);

  return rows as RetrievedChunk[];
}
