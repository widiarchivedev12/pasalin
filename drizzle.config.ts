import { defineConfig } from "drizzle-kit";

// channel_binding=require tidak didukung driver postgres JS — strip sebelum dipakai drizzle-kit
function cleanDbUrl(raw: string): string {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanDbUrl(process.env.DATABASE_URL!),
  },
});
