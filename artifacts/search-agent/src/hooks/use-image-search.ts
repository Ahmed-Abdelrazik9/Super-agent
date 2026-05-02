import { useState, useCallback, useRef } from "react";

export interface ImageResult {
  url:       string;
  thumbnail: string;
  title:     string;
  sourceUrl: string;
  source:    string;
  width:     number;
  height:    number;
}

export function useImageSearch() {
  const [images, setImages]       = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [query, setQuery]         = useState("");
  const [page, setPage]           = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const abortRef                  = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string, pg = 0) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    if (pg === 0) { setImages([]); setQuery(q); setPage(0); }

    try {
      const res = await fetch(
        `/api/search/images?q=${encodeURIComponent(q)}&page=${pg}`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error(`Image search failed (${res.status})`);
      const data = await res.json() as { images: ImageResult[] };
      setImages((prev) => pg === 0 ? data.images : [...prev, ...data.images]);
      setHasMore(data.images.length >= 80);
      setPage(pg);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Image search failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && query) search(query, page + 1);
  }, [isLoading, hasMore, query, page, search]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { search, loadMore, stop, images, isLoading, error, query, hasMore };
}
