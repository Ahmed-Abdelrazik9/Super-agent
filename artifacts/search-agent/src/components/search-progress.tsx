import { useEffect, useState, useRef, useMemo } from "react";
import { Globe, Search, ExternalLink } from "lucide-react";

interface SearchProgressProps {
  query: string;
  mode: string;
  status: { message: string; phase: string } | null;
  searchQueries: string[];
  synthesis: string;
  compact?: boolean;
}

/* ── Elapsed timer ─────────────────────────────────────────── */
function ElapsedTimer() {
  const [s, setS] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setS(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, []);
  return <span className="text-muted-foreground">{s}s</span>;
}

/* ── Favicon + domain pill ─────────────────────────────────── */
interface LiveSource { url: string; domain: string; title: string }

function SourcePill({ src }: { src: LiveSource }) {
  const [ok, setOk] = useState(true);
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/50 transition-colors text-xs text-foreground/70 hover:text-foreground whitespace-nowrap"
    >
      {ok
        ? <img src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`} alt="" className="w-3.5 h-3.5 rounded-sm" onError={() => setOk(false)} />
        : <Globe className="w-3.5 h-3.5 text-muted-foreground" />
      }
      {src.domain}
    </a>
  );
}

/* ── Extract live sources from streaming text ──────────────── */
function extractLiveSources(text: string): LiveSource[] {
  const seen = new Set<string>();
  const results: LiveSource[] = [];
  const re = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    try {
      const domain = new URL(m[2]).hostname.replace("www.", "");
      if (!seen.has(domain)) { seen.add(domain); results.push({ url: m[2], domain, title: m[1] || domain }); }
    } catch {}
  }
  return results;
}

/* ── Main component ────────────────────────────────────────── */
export function SearchProgress({ query, mode, status, searchQueries, synthesis, compact = false }: SearchProgressProps) {
  const liveSources = useMemo(() => extractLiveSources(synthesis), [synthesis]);
  const isSynthesizing = synthesis.length > 0;

  // Compact mode — single status line used inside search results page
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span>{status?.message || "Searching..."}</span>
        <span>•</span>
        <ElapsedTimer />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes source-pill-in {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .source-pill-in { animation: source-pill-in 0.25s ease-out both; }
        .sources-row::-webkit-scrollbar { display: none; }
        .sources-row { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-full space-y-4 py-2 animate-in fade-in duration-300">

        {/* Row 1 — "Searching … • Xs" */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4 text-muted-foreground/60 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.2"/><circle cx="8" cy="3" r="1.2"/><circle cx="13" cy="3" r="1.2"/>
            <circle cx="3" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="13" cy="8" r="1.2"/>
            <circle cx="3" cy="13" r="1.2"/><circle cx="8" cy="13" r="1.2"/><circle cx="13" cy="13" r="1.2"/>
          </svg>
          <span>
            {isSynthesizing ? "Synthesizing answer" : searchQueries.length > 0 ? `Searching ${searchQueries[searchQueries.length - 1]}` : "Searching the web"}
          </span>
          <span>•</span>
          <ElapsedTimer />
        </div>

        {/* Row 2 — "Searched for 'X' · N results" (one per query, show latest) */}
        {searchQueries.map((q, i) => (
          <div key={i} className="flex items-center gap-2 text-sm animate-in fade-in duration-300">
            <Search className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            <span className="text-foreground/80">
              Searched for <span className="font-medium">"{q}"</span>
            </span>
          </div>
        ))}

        {/* Row 3 — Source pills */}
        {liveSources.length > 0 && (
          <div className="sources-row flex gap-2 overflow-x-auto pb-1 animate-in fade-in duration-300">
            {liveSources.map((src, i) => (
              <div key={src.domain} className="source-pill-in" style={{ animationDelay: `${i * 60}ms` }}>
                <SourcePill src={src} />
              </div>
            ))}
          </div>
        )}

        {/* Row 4 — Streaming synthesis preview */}
        {synthesis && (
          <div className="text-sm text-foreground/80 leading-relaxed space-y-1 animate-in fade-in duration-300" dir="auto">
            {synthesis.split("\n").filter(Boolean).slice(0, 6).map((line, i) => (
              <p key={i} className="flex gap-2">
                {line.startsWith("•") || line.startsWith("-") || line.startsWith("*")
                  ? <><span className="text-muted-foreground shrink-0">•</span><span>{line.replace(/^[•\-*]\s*/, "")}</span></>
                  : <span>{line}</span>
                }
              </p>
            ))}
            <span className="inline-block w-1.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-pulse rounded-sm" />
          </div>
        )}

      </div>
    </>
  );
}
