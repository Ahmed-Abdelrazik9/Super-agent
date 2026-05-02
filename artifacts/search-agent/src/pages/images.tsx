import { useEffect, useState, useRef } from "react";
import { useSearch } from "wouter";
import Layout from "@/components/layout";
import { SearchBar, type SearchMode } from "@/components/search-bar";
import { useImageSearch } from "@/hooks/use-image-search";
import { useLocation } from "wouter";
import { useSearchStream } from "@/hooks/use-search-stream";
import { Image, ExternalLink, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImagesPage() {
  const rawSearch = useSearch();
  const params    = new URLSearchParams(rawSearch);
  const queryParam = params.get("q") ?? "";
  const [, setLocation] = useLocation();
  const { images, isLoading, error, query, hasMore, search, loadMore, stop } = useImageSearch();
  const { startSearch } = useSearchStream();
  const [lightbox, setLightbox]   = useState<null | { url: string; title: string; sourceUrl: string }>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Kick off search when the URL query changes
  useEffect(() => {
    if (queryParam) search(queryParam);
  }, [queryParam]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !isLoading) loadMore();
    }, { threshold: 0.1 });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const handleSearch = (q: string, mode: SearchMode) => {
    if (mode === "images") {
      setLocation(`/images?q=${encodeURIComponent(q)}`);
    } else {
      startSearch(q, mode as any);
    }
  };

  return (
    <Layout>
      <div className="h-full overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">

          {/* Sticky search bar */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-2 pb-4 border-b border-border/50">
            <SearchBar
              onSearch={handleSearch}
              onStop={stop}
              isSearching={isLoading}
              initialQuery={queryParam}
              initialMode="images"
            />
          </div>

          {/* Header */}
          {query && (
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-pink-400" />
              <h1 className="text-2xl font-bold tracking-tight">
                Images for <span className="text-pink-400">"{query}"</span>
              </h1>
              {images.length > 0 && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                  {images.length} results
                </span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Skeleton loading */}
          {isLoading && images.length === 0 && (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="break-inside-avoid rounded-lg bg-muted animate-pulse"
                  style={{ height: `${120 + (i % 5) * 40}px` }}
                />
              ))}
            </div>
          )}

          {/* Masonry image grid */}
          {images.length > 0 && (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
              {images.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  onClick={() => setLightbox({ url: img.url, title: img.title, sourceUrl: img.sourceUrl })}
                  className="break-inside-avoid block w-full rounded-lg overflow-hidden bg-muted group relative cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <img
                    src={img.thumbnail || img.url}
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-end">
                    <div className="w-full p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                      <p className="text-white text-xs line-clamp-2 text-left font-medium drop-shadow">
                        {img.title}
                      </p>
                      <p className="text-white/70 text-[10px] mt-0.5 font-mono">{img.source}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Load more / infinite scroll trigger */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoading && images.length > 0 && (
              <Loader2 className="h-6 w-6 text-pink-400 animate-spin" />
            )}
          </div>

          {/* Empty state */}
          {!isLoading && images.length === 0 && query && !error && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Image className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No images found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}

        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt={lightbox.title}
              className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
              onError={(e) => { (e.target as HTMLImageElement).src = lightbox.url; }}
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm rounded-b-lg p-3 flex items-center justify-between gap-4">
              <p className="text-white text-sm font-medium line-clamp-1">{lightbox.title}</p>
              <a
                href={lightbox.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-pink-400 hover:text-pink-300 text-xs font-mono transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Source
              </a>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
