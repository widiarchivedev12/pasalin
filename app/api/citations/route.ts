import { retrieveChunks } from "@/lib/retrieve";
import { buildCitationList } from "@/lib/prompt";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const documentId = req.nextUrl.searchParams.get("documentId");

  if (!q) {
    return Response.json([], { status: 400 });
  }

  const retrieved = await retrieveChunks(
    q,
    5,
    documentId ? parseInt(documentId) : undefined
  );
  return Response.json(buildCitationList(retrieved));
}
