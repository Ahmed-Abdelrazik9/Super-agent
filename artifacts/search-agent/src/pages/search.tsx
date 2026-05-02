import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Layout from "@/components/layout";
import { SearchBar, type SearchMode } from "@/components/search-bar";
import { useSearchStream } from "@/hooks/use-search-stream";
import { useGetSearch, getGetSearchQueryKey } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import {
  ExternalLink, ShieldCheck, ShieldAlert, Shield,
  Zap, Layers, Brain, Search as SearchIcon, ArrowRight, Image,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const { id }            = useParams<{ id: string }>();
  const [, setLocation]   = useLocation();

  const { data: searchData, isLoading } = useGetSearch(id || "", {
    query: { enabled: !!id, queryKey: getGetSearchQueryKey(id || "") },
  });

  const {
    startSearch, startFollowUp, stopSearch,
    isSearching, status, synthesis: streamingSynthesis, result,
  } = useSearchStream();

  const displayData       = result || searchData;
  const isStreaming       = isSearching;
  const currentSynthesis  = isStreaming ? streamingSynthesis : displayData?.synthesis;

  const handleSearch = (q: string, mode: SearchMode) => {
    if (mode === "images") {
      setLocation(`/images?q=${encodeURIComponent(q)}`);
    } else {
      startSearch(q, mode as any);
    }
  };

  const getCredibilityColor = (score: number) =>
    score > 0.8 ? "text-green-500 bg-green-500/10 border-green-500/20"
    : score > 0.6 ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    : "text-red-500 bg-red-500/10 border-red-500/20";

  const getCredibilityIcon = (score: number) =>
    score > 0.8 ? <ShieldCheck className="h-3 w-3" />
    : score > 0.6 ? <Shield className="h-3 w-3" />
    : <ShieldAlert className="h-3 w-3" />;

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

          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {displayData?.query || "Searching..."}
            </h1>
            <div className="flex items-center gap-2">
              {displayData && getModeBadge(displayData.mode)}
              {displayData?.duration && (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                  {(displayData.duration / 1000).toFixed(2)}s
                </span>
              )}
              {/* Quick image search for same query */}
              {displayData?.query && (
                <button
                  onClick={() => setLocation(`/images?q=${encodeURIComponent(displayData.query)}`)}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded hover:bg-pink-500/20 transition-colors font-mono"
                >
                  <Image className="w-3 h-3" /> Images
                </button>
              )}
            </div>
          </div>

          {/* Status during streaming */}
          {isStreaming && status && (
            <div className="flex items-center gap-3 text-primary bg-primary/5 border border-primary/20 p-4 rounded-lg animate-in fade-in">
              <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-sm uppercase tracking-wider">{status.phase}: {status.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Main: Synthesis */}
            <div className="lg:col-span-8 space-y-8">
              <div
                dir="auto"
                className={cn(
                  "prose prose-invert max-w-none",
                  "[&_*]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground",
                  "[&_h4]:text-foreground [&_p]:text-foreground [&_li]:text-foreground",
                  "[&_strong]:text-white [&_a]:text-primary [&_code]:text-primary",
                  "[&_blockquote]:border-primary [&_blockquote]:text-muted-foreground",
                  isStreaming && "opacity-90"
                )}
              >
                {currentSynthesis ? (
                  <ReactMarkdown>{currentSynthesis}</ReactMarkdown>
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[95%]" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                )}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                )}
              </div>

              {/* Follow-up Section */}
              {displayData && !isStreaming && (
                <div className="border-t border-border pt-8 mt-12 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-lg font-mono font-bold mb-4 flex items-center gap-2">
                    <SearchIcon className="w-5 h-5 text-muted-foreground" />
                    Explore Further
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {displayData.followUps?.map((q, i) => (
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

            {/* Sidebar: Sources & Related */}
            <div className="lg:col-span-4 space-y-8">

              {/* Sources */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Sources Cited</h3>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{displayData?.sources?.length || 0}</span>
                </div>

                <div className="space-y-3">
                  {(displayData?.sources || []).map((source, i) => (
                    <Card key={i} className="bg-card/50 hover:bg-card transition-colors border-border/50 overflow-hidden group">
                      <CardContent className="p-4 relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-muted group-hover:bg-primary/50 transition-colors" />
                        <div className="flex items-start justify-between gap-2 mb-2 pl-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs font-mono text-muted-foreground">[{i + 1}]</span>
                            <span className="text-xs font-medium truncate">{source.domain}</span>
                          </div>
                          <div className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0", getCredibilityColor(source.credibilityScore))}>
                            {getCredibilityIcon(source.credibilityScore)}
                            {Math.round(source.credibilityScore * 100)}%
                          </div>
                        </div>
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="pl-2 block group-hover:text-primary transition-colors">
                          <h4 dir="auto" className="font-medium text-sm line-clamp-2 mb-1">{source.title}</h4>
                          <p  dir="auto" className="text-xs text-muted-foreground line-clamp-2">{source.snippet}</p>
                        </a>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pl-2 mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          {source.url.slice(0, 40)}...
                        </a>
                      </CardContent>
                    </Card>
                  ))}

                  {isStreaming && (
                    <div className="space-y-3 opacity-50">
                      {[1, 2].map((i) => (
                        <Card key={i} className="bg-card/30 border-border/30">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex gap-2"><Skeleton className="w-4 h-4" /><Skeleton className="w-24 h-4" /></div>
                            <Skeleton className="w-full h-8" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Related Queries */}
              {displayData?.relatedQueries && displayData.relatedQueries.length > 0 && !isStreaming && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Related</h3>
                  <div className="flex flex-col gap-2">
                    {displayData.relatedQueries.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => startSearch(q, (displayData.mode as any) || "deep")}
                        dir="auto"
                        className="text-sm text-left text-muted-foreground hover:text-foreground hover:underline decoration-primary/50 underline-offset-4 py-1"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
