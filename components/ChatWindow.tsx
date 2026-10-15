"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2Icon, SendHorizonalIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { CitationCard, type Citation } from "@/components/CitationCard";

const EXAMPLE_QUESTIONS = [
  "Apa sanksi pidana pencemaran nama baik menurut UU ITE?",
  "Apa yang dimaksud informasi elektronik?",
  "Apa kewajiban penyelenggara sistem elektronik?",
];

interface Document {
  id: number;
  title: string;
  type: string;
}

// ─── Outer: kelola pilihan dokumen ───────────────────────────────────────────

export function ChatWindow() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then(setDocuments)
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Filter dokumen */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedDocId(undefined)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
              selectedDocId === undefined
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            Semua
          </button>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                selectedDocId === doc.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {doc.title}
            </button>
          ))}
        </div>
      )}

      {/* key berubah saat dokumen berganti → chat direset */}
      <ChatInner key={selectedDocId ?? "all"} documentId={selectedDocId} />
    </div>
  );
}

// ─── Inner: chat logic dengan documentId yang tetap ──────────────────────────

function ChatInner({ documentId }: { documentId?: number }) {
  const [input, setInput] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [lastQuestion, setLastQuestion] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: documentId !== undefined ? { documentId } : {},
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: async () => {
      if (!lastQuestion) return;
      try {
        const params = new URLSearchParams({ q: lastQuestion });
        if (documentId !== undefined) params.set("documentId", String(documentId));
        const res = await fetch(`/api/citations?${params}`);
        if (res.ok) setCitations(await res.json());
      } catch {
        setCitations([]);
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  function handleSend() {
    if (!input.trim() || isLoading) return;
    setLastQuestion(input.trim());
    setCitations([]);
    sendMessage({ text: input.trim() });
    setInput("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Area pesan */}
      <div className="min-h-0 flex-1">
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="h-full rounded-2xl border bg-muted/20">
            <MessageScrollerViewport className="p-4">
              <MessageScrollerContent>
                {/* Empty state */}
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary font-bold text-2xl text-primary-foreground shadow-lg shadow-primary/20">
                      §
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold tracking-tight">
                        Tanyakan isi peraturan
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Jawaban langsung dari teks resmi, lengkap dengan sitasi pasal.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                      {EXAMPLE_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => setInput(q)}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:text-foreground hover:shadow-md"
                        >
                          <SparklesIcon className="size-3 shrink-0 text-primary" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pesan */}
                {messages.map((m, i) => {
                  const isUser = m.role === "user";
                  const isLastAssistant = !isUser && i === messages.length - 1;
                  const text = m.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join("");

                  return (
                    <MessageScrollerItem key={m.id} scrollAnchor={isUser}>
                      <Message align={isUser ? "end" : "start"}>
                        {/* Avatar */}
                        <MessageAvatar
                          className={cn(
                            "size-7 text-[11px] font-bold",
                            isUser
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {isUser ? "Ku" : "§"}
                        </MessageAvatar>

                        <MessageContent>
                          <Bubble
                            variant={isUser ? "default" : "muted"}
                            align={isUser ? "end" : "start"}
                          >
                            <BubbleContent>
                              {isUser ? (
                                <p className="whitespace-pre-wrap">{text}</p>
                              ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs dark:[&_code]:bg-white/10 [&_pre]:rounded-lg [&_pre]:bg-black/10 [&_pre]:p-3 dark:[&_pre]:bg-white/10 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:opacity-80">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {text}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </BubbleContent>
                          </Bubble>

                          {isLastAssistant && citations.length > 0 && (
                            <CitationCard citations={citations} />
                          )}
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  );
                })}

                {/* Loading dots */}
                {isLoading && (
                  <MessageScrollerItem>
                    <Message align="start">
                      <MessageAvatar className="size-7 bg-primary text-[11px] font-bold text-primary-foreground">
                        §
                      </MessageAvatar>
                      <MessageContent>
                        <Bubble variant="muted">
                          <BubbleContent>
                            <span className="inline-flex items-center gap-1 py-0.5">
                              <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:0ms]" />
                              <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:150ms]" />
                              <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:300ms]" />
                            </span>
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {/* Input */}
      <InputGroup>
        <InputGroupTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan tentang peraturan Indonesia..."
          rows={1}
          className="max-h-32"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <InputGroupAddon align="block-end" className="justify-end">
          <InputGroupButton
            size="icon-sm"
            disabled={isLoading || !input.trim()}
            onClick={handleSend}
          >
            {isLoading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SendHorizonalIcon className="size-4" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
