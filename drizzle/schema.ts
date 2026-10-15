import {
  pgTable,
  serial,
  text,
  timestamp,
  vector,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const documentTypeEnum = pgEnum("document_type", [
  "UU",
  "Perda",
  "Kampus",
  "Lainnya",
]);

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: documentTypeEnum("type").notNull(),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  chapter: text("chapter"),
  article: text("article"),
  content: text("content").notNull(),
  // dimensi 3072 sesuai gemini-embedding-001 (output native)
  embedding: vector("embedding", { dimensions: 3072 }),
  page: integer("page"),
});
