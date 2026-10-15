import { Suspense } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { TriangleAlertIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {/* Logo */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
            §
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-none tracking-tight">
              Pasalin
            </h1>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Tanya aturan, dapat pasalnya.
            </p>
          </div>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="shrink-0 border-b bg-amber-50/80 px-4 py-2 dark:bg-amber-950/20">
        <div className="mx-auto flex max-w-3xl items-center gap-1.5">
          <TriangleAlertIcon className="size-3 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Bukan nasihat hukum resmi.</strong> Selalu rujuk teks
            peraturan resmi dan konsultasikan ke advokat atau LBH.
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 py-4">
        <Suspense>
          <ChatWindow />
        </Suspense>
      </div>
    </main>
  );
}
