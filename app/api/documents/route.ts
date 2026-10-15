import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const docs = await db
    .select({ id: documents.id, title: documents.title, type: documents.type })
    .from(documents)
    .orderBy(asc(documents.createdAt));

  return Response.json(docs);
}
