import { useEffect, useState, useRef, useMemo } from "react";
import { Globe, CheckCircle2, Loader2, Zap, Layers, Brain, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchProgressProps {
  query: string;
  mode: string;
  status: { message: string; phase: string } | null;
  searchQueries: string[];
  synthesis: string;
  compact?: boolean;
}

function ModeBadge({ mode }: { mode: string }) {
  if (mode === "quick")  return <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400"><Zap className="h-2.5 w-2.5" />QUICK</span>;
  if (mode === "expert") return <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-400"><Brain className="h-2.5 w-2.5" />EXPERT</span>;
  return <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary"><Layers className="h-2.5 w-2.5" />DEEP</span>;
}

function ElapsedTimer() {
  const [ms, setMs] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setMs(Date.now() - start.current), 100);
    return () => clearInterval(iv);
  }, []);
  return (
    <span className="font-mono text-sm tabular-nums text-foreground/70">
      {(ms / 1000).toFixed(1)}<span className="text-muted-foreground text-xs">s</span>
    </span>
  );
}

interface LiveSource {
  url: string;
  domain: string;
  title: string;
}

function extractLiveSources(text: string): LiveSource[] {
  const seen = new Set<string>();
  const results: LiveSource[] = [];
  // Match markdown links: [title](url)
  const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdRegex.exec(text)) !== null) {
    const [, title, url] = m;
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      if (!seen.has(domain)) {
        seen.add(domain);
        results.push({ url, domain, title: title || domain });
      }
    } catch {}
  }
  // Also match bare URLs wrapped in parentheses like (https://...)
  const bareRegex = /\((https?:\/\/[^\s)]+)\)/g;
  while ((m = bareRegex.exec(text)) !== null) {
    const url = m[1];
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      if (!seen.has(domain)) {
        seen.add(domain);
        results.push({ url, domain, title: domain });
      }
    } catch {}
  }
  return results;
}

function SourceCard({ src, index }: { src: LiveSource; index: number }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card-enter group flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/60 bg-card/80 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${index * 80}ms` }}
      title={src.title}
    >
      {imgOk ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
          alt=""
          className="w-4 h-4 rounded-sm flex-shrink-0"
          onError={() => setImgOk(false)}
        />
      ) : (
        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
      <span className="text-xs font-medium text-foreground/80 whitespace-nowrap max-w-[120px] truncate">
        {src.domain}
      </span>
      <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 transition-colors" />
    </a>
  );
}

interface Step {
  key: string;
  label: string;
  sublabel?: string;
  state: "done" | "active" | "pending";
}

export function SearchProgress({ query, mode, status, searchQueries, synthesis, compact = false }: SearchProgressProps) {
  const isSynthesizing = synthesis.length > 0;
  const liveSources = useMemo(() => extractLiveSources(synthesis), [synthesis]);

  const steps: Step[] = [
    { key: "init",   label: "Query received",       state: "done" },
    {
      key: "search", label: "Searching the web",
      state: searchQueries.length > 0 || isSynthesizing ? "done" : "active",
      sublabel: searchQueries.length > 0 ? `${searchQueries.length} search${searchQueries.length > 1 ? "es" : ""} performed` : undefined,
    },
    {
      key: "read",   label: "Reading sources",
      state: isSynthesizing ? (liveSources.length > 0 ? "done" : "active") : searchQueries.length > 0 ? "active" : "pending",
      sublabel: liveSources.length > 0 ? `${liveSources.length} source${liveSources.length > 1 ? "s" : ""} read` : undefined,
    },
    { key: "synth",  label: "Synthesizing answer",  state: isSynthesizing ? "active" : "pending" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "1.5s" }} />
          <Globe className="relative h-4 w-4 text-primary animate-spin" style={{ animationDuration: "3s" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-primary truncate">
            {status?.message || "Searching..."}
          </p>
          {searchQueries.length > 0 && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">"{searchQueries[searchQueries.length - 1]}"</p>
          )}
        </div>
        <ElapsedTimer />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes orb-glow {
          0%, 100% { box-shadow: 0 0 30px 5px rgba(0,255,255,0.25), 0 0 60px 10px rgba(0,255,255,0.1); }
          50%       { box-shadow: 0 0 50px 10px rgba(0,255,255,0.4), 0 0 100px 20px rgba(0,255,255,0.15); }
        }
        @keyframes ring-1 {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0;   }
        }
        @keyframes ring-2 {
          0%   { transform: scale(1);   opacity: 0.35; }
          100% { transform: scale(1.9); opacity: 0;    }
        }
        @keyframes ring-3 {
          0%   { transform: scale(1);   opacity: 0.2; }
          100% { transform: scale(2.5); opacity: 0;   }
        }
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slide-in-step {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0);     }
        }
        @keyframes query-appear {
          from { opacity: 0; transform: translateY(6px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);   max-height: 60px; }
        }
        @keyframes source-card-enter {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes read-pulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1;   }
        }
        .step-animate       { animation: slide-in-step 0.35s ease-out both; }
        .query-animate      { animation: query-appear 0.3s ease-out both; }
        .source-card-enter  { animation: source-card-enter 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .sources-scroll::-webkit-scrollbar { display: none; }
        .sources-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-full max-w-xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">

        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-primary">Intelligence Active</span>
          </div>
          <div className="flex items-center gap-2">
            <ElapsedTimer />
            <ModeBadge mode={mode} />
          </div>
        </div>

        {/* ── Orb ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full border border-primary/40" style={{ animation: "ring-1 2s ease-out infinite" }} />
            <div className="absolute w-24 h-24 rounded-full border border-primary/30" style={{ animation: "ring-2 2s ease-out infinite", animationDelay: "0.6s" }} />
            <div className="absolute w-24 h-24 rounded-full border border-primary/20" style={{ animation: "ring-3 2s ease-out infinite", animationDelay: "1.2s" }} />
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center relative z-10 overflow-hidden"
              style={{
                background: "radial-gradient(circle at 40% 35%, rgba(0,255,255,0.25), rgba(0,255,255,0.05))",
                border: "1px solid rgba(0,255,255,0.4)",
                animation: "orb-glow 2s ease-in-out infinite",
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, transparent 70%, rgba(0,255,255,0.3) 100%)",
                  animation: "radar-sweep 2s linear infinite",
                }}
              />
              <Globe
                className="h-9 w-9 text-primary relative z-10"
                style={{ animation: "radar-sweep 8s linear infinite reverse" }}
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold tracking-tight truncate max-w-sm" dir="auto">{query}</h2>
            <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
              {isSynthesizing ? "Generating response..." : searchQueries.length > 0 ? "Analyzing sources..." : "Scanning the web..."}
            </p>
          </div>
        </div>

        {/* ── Step timeline ────────────────────────────────── */}
        <div className="relative space-y-0">
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border/60" />
          {steps.map((step, i) => (
            <div
              key={step.key}
              className="step-animate flex items-start gap-3 py-2.5 pl-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center">
                {step.state === "done" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {step.state === "active" && (
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "1s" }} />
                    <Loader2 className="relative h-5 w-5 text-primary animate-spin" />
                  </div>
                )}
                {step.state === "pending" && <div className="h-5 w-5 rounded-full border-2 border-border bg-background" />}
              </div>
              <div className="pt-0.5 min-w-0">
                <p className={cn(
                  "text-sm font-medium leading-none",
                  step.state === "done"    && "text-muted-foreground",
                  step.state === "active"  && "text-foreground",
                  step.state === "pending" && "text-muted-foreground/50",
                )}>
                  {step.label}
                </p>
                {step.sublabel && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{step.sublabel}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Live source website cards ─────────────────────── */}
        {liveSources.length > 0 && (
          <div className="space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-primary/60" style={{ animation: "read-pulse 1.5s ease-in-out infinite" }} />
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Reading {liveSources.length} source{liveSources.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="sources-scroll flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {liveSources.map((src, i) => (
                <SourceCard key={src.domain} src={src} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Live search queries ──────────────────────────── */}
        {searchQueries.length > 0 && (
          <div className="space-y-2 pl-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Web Queries</p>
            {searchQueries.map((q, i) => (
              <div
                key={i}
                className="query-animate flex items-center gap-2 text-sm"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                <span
                  className={cn(
                    "font-mono truncate",
                    i < searchQueries.length - 1 || isSynthesizing
                      ? "text-muted-foreground line-through decoration-muted-foreground/40"
                      : "text-foreground"
                  )}
                  dir="auto"
                >
                  "{q}"
                </span>
                {(i < searchQueries.length - 1 || isSynthesizing) && (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Synthesis preview ────────────────────────────── */}
        {synthesis && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">Synthesis</p>
            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4" dir="auto">
              {synthesis}
              <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 align-middle animate-pulse" />
            </p>
          </div>
        )}
      </div>
    </>
  );
}
