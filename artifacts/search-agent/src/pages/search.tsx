import { useParams, useLocation } from "wouter";
import Layout from "@/components/layout";
import { SearchBar, type SearchMode } from "@/components/search-bar";
import { SearchProgress } from "@/components/search-progress";
import { useSearchStream } from "@/hooks/use-search-stream";
import { useGetSearch, getGetSearchQueryKey } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import {
  Globe, ExternalLink,
  Zap, Layers, Brain, Search as SearchIcon, ArrowRight, Image,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ── Grok-style Source Cards ──────────────────────────────── */

function FavIcon({ domain }: { domain: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
      onError={() => setOk(false)}
    />
  );
}

function SourceCard({ source, index }: { source: any; index: number }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-150 min-w-[180px] max-w-[220px] flex-shrink-0"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FavIcon domain={source.domain} />
          <span className="text-xs text-muted-foreground truncate font-medium">{source.domain}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded flex-shrink-0">
          {index + 1}
        </span>
      </div>
      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors">
        {source.title}
      </p>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 group-hover:text-primary/60 transition-colors">
        <ExternalLink className="w-2.5 h-2.5" />
        <span className="truncate">{source.url.replace(/^https?:\/\//, "").slice(0, 35)}</span>
      </div>
    </a>
  );
}

function SourceCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-card/30 min-w-[180px] max-w-[220px] flex-shrink-0 animate-pulse">
      <div className="flex items-center gap-1.5">
        <Skeleton className="w-3.5 h-3.5 rounded-sm" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

function SourceCards({ sources, isStreaming }: { sources: any[]; isStreaming: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_COUNT = 4;
  const showToggle = sources.length > COLLAPSED_COUNT;
  const visible = expanded ? sources : sources.slice(0, COLLAPSED_COUNT);

  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Globe className="w-3 h-3" />
          Sources
          {sources.length > 0 && (
            <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px]">
              {sources.length}
            </span>
          )}
        </h3>
        {showToggle && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {expanded ? "Show less" : `+${sources.length - COLLAPSED_COUNT} more`}
            <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")} />
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {visible.map((src, i) => (
          <SourceCard key={src.url || i} source={src} index={i} />
        ))}
        {isStreaming && sources.length === 0 && (
          <>
            <SourceCardSkeleton />
            <SourceCardSkeleton />
            <SourceCardSkeleton />
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { id }          = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: searchData, isLoading } = useGetSearch(id || "", {
    query: { enabled: !!id, queryKey: getGetSearchQueryKey(id || "") },
  });

  const {
    startSearch, startFollowUp, stopSearch,
    isSearching, status, searchQueries, synthesis: streamingSynthesis, result,
  } = useSearchStream();

  const displayData      = result || searchData;
  const isStreaming      = isSearching;
  const currentSynthesis = isStreaming ? streamingSynthesis : displayData?.synthesis;

  // Extract the user's query for the progress display (from the follow-up or loaded result)
  const activeQuery = displayData?.query ?? "";

  const handleSearch = (q: string, mode: SearchMode) => {
    if (mode === "images") {
      setLocation(`/images?q=${encodeURIComponent(q)}`);
    } else {
      startSearch(q, mode as any);
    }
  };

  const getModeBadge = (mode?: string) => {
    switch (mode) {
      case "quick":  return <div className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded"><Zap className="w-3 h-3"/> Quick</div>;
      case "expert": return <div className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded"><Brain className="w-3 h-3"/> Expert</div>;
      default:       return <div className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded"><Layers className="w-3 h-3"/> Deep</div>;
    }
  };

  if (isLoading && !isStreaming && !displayData) {
    return (
      <Layout>
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-16 w-full max-w-3xl mx-auto rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full overflow-auto scroll-smooth">
        <div className="p-6 max-w-6xl mx-auto space-y-8 pb-32">

          {/* Sticky search bar */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-2 pb-6 border-b border-border/50">
            <SearchBar
              onSearch={handleSearch}
              onStop={stopSearch}
              isSearching={isSearching}
              initialQuery={displayData?.query || ""}
              initialMode={(displayData?.mode as SearchMode) || "deep"}
            />
          </div>

          {/* ── Follow-up searching: full progress view ── */}
          {isStreaming && !streamingSynthesis && (
            <div className="flex justify-center py-4">
              <SearchProgress
                query={activeQuery || searchQueries[0] || "Searching..."}
                mode={displayData?.mode || "deep"}
                status={status}
                searchQueries={searchQueries}
                synthesis={streamingSynthesis}
              />
            </div>
          )}

          {/* ── Compact progress + streaming synthesis ── */}
          {isStreaming && streamingSynthesis && (
            <div className="space-y-4">
              <SearchProgress
                query={activeQuery || searchQueries[0] || "Searching..."}
                mode={displayData?.mode || "deep"}
                status={status}
                searchQueries={searchQueries}
                synthesis=""
                compact
              />
            </div>
          )}

          {/* ── Title row (only when we have data and not in full-progress mode) ── */}
          {(!isStreaming || streamingSynthesis) && displayData && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-3xl font-bold tracking-tight" dir="auto">
                {displayData.query}
              </h1>
              <div className="flex items-center gap-2">
                {getModeBadge(displayData.mode)}
                {displayData.duration && (
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    {(displayData.duration / 1000).toFixed(2)}s
                  </span>
                )}
                <button
                  onClick={() => setLocation(`/images?q=${encodeURIComponent(displayData.query)}`)}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded hover:bg-pink-500/20 transition-colors font-mono"
                >
                  <Image className="w-3 h-3" /> Images
                </button>
              </div>
            </div>
          )}

          <div className="space-y-8 max-w-3xl">

            {/* ── Grok-style source cards ── */}
            {((displayData?.sources && displayData.sources.length > 0) || isStreaming) && (
              <SourceCards sources={displayData?.sources || []} isStreaming={isStreaming} />
            )}

            {/* ── Synthesis ── */}
            {currentSynthesis ? (
              <div
                dir="auto"
                className={cn(
                  "prose prose-invert max-w-none",
                  "[&_*]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground",
                  "[&_h4]:text-foreground [&_p]:text-foreground [&_li]:text-foreground",
                  "[&_strong]:text-white [&_a]:text-primary [&_code]:text-primary",
                  "[&_blockquote]:border-primary [&_blockquote]:text-muted-foreground",
                )}
              >
                <ReactMarkdown>{currentSynthesis}</ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                )}
              </div>
            ) : !isStreaming && (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[95%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            )}

            {/* ── Related queries ── */}
            {displayData?.relatedQueries && displayData.relatedQueries.length > 0 && !isStreaming && (
              <div className="space-y-3 pt-2">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Related</h3>
                <div className="flex flex-col gap-1">
                  {displayData.relatedQueries.map((q: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => startSearch(q, (displayData.mode as any) || "deep")}
                      dir="auto"
                      className="text-sm text-left text-muted-foreground hover:text-foreground flex items-center gap-2 group py-1.5 border-b border-border/40 last:border-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors shrink-0" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Follow-up suggestions ── */}
            {displayData && !isStreaming && (
              <div className="border-t border-border pt-8 mt-12 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-lg font-mono font-bold mb-4 flex items-center gap-2">
                  <SearchIcon className="w-5 h-5 text-muted-foreground" />
                  Explore Further
                </h3>
                <div className="flex flex-wrap gap-3">
                  {displayData.followUps?.map((q: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => startFollowUp(displayData.id, q)}
                      dir="auto"
                      className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-primary/5 text-sm text-left transition-colors flex items-center gap-2 group"
                    >
                      {q}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -ml-2 group-hover:ml-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
