"use client";

import { BookOpenIcon } from "lucide-react";

export interface Citation {
  index: number;
  documentTitle: string;
  chapter: string | null;
  article: string | null;
  content: string;
  page: number | null;
}

interface CitationCardProps {
  citations: Citation[];
}

export function CitationCard({ citations }: CitationCardProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <BookOpenIcon className="size-3" />
        Sumber
      </p>
      <div className="space-y-2">
        {citations.map((c) => (
          <div
            key={c.index}
            className="rounded-xl border bg-background/60 px-3.5 py-3 text-xs backdrop-blur-sm"
          >
            {/* Header sitasi */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                {c.index}
              </span>
              <span className="font-semibold text-foreground">
                {c.documentTitle}
              </span>
              {c.article && (
                <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {c.article}
                </span>
              )}
              {c.chapter && (
                <span className="text-muted-foreground">{c.chapter}</span>
              )}
              {c.page && (
                <span className="ml-auto text-muted-foreground">
                  hal. {c.page}
                </span>
              )}
            </div>
            {/* Kutipan */}
            <blockquote className="mt-2 border-l-2 border-primary/30 pl-3 italic leading-relaxed text-muted-foreground line-clamp-3">
              {c.content}
            </blockquote>
          </div>
        ))}
      </div>
    </div>
  );
}
