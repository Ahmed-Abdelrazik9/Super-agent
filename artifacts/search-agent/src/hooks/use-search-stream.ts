import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";

export type SearchMode = "quick" | "deep" | "expert";

export type StreamStatus = {
  message: string;
  phase: string;
};

export type StreamResult = {
  id: string;
  query: string;
  mode: string;
  synthesis: string;
  sources: any[];
  followUps: string[];
  relatedQueries: string[];
  duration: number;
};

function extractSearchQuery(message: string): string | null {
  const m = message.match(/Searching:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

export function useSearchStream() {
  const [isSearching, setIsSearching]       = useState(false);
  const [synthesis, setSynthesis]           = useState("");
  const [status, setStatus]                 = useState<StreamStatus | null>(null);
  const [searchQueries, setSearchQueries]   = useState<string[]>([]);
  const [result, setResult]                 = useState<StreamResult | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const abortControllerRef                  = useRef<AbortController | null>(null);
  const [, setLocation]                     = useLocation();

  const startSearch = useCallback(async (query: string, mode: SearchMode) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setSynthesis("");
    setStatus(null);
    setSearchQueries([]);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to start search");
      if (!response.body) throw new Error("No response body");

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (eventType === "status") {
                setStatus(data);
                const q = extractSearchQuery(data.message);
                if (q) setSearchQueries((prev) => (prev.includes(q) ? prev : [...prev, q]));
              } else if (eventType === "delta") {
                setSynthesis((prev) => prev + data.content);
              } else if (eventType === "complete") {
                setResult(data);
                setIsSearching(false);
                setLocation(`/search/${data.id}`);
              } else if (eventType === "error") {
                setError(data.message);
                setIsSearching(false);
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "An error occurred during search");
        setIsSearching(false);
      }
    }
  }, [setLocation]);

  const startFollowUp = useCallback(async (id: string, question: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setSynthesis("");
    setStatus(null);
    setSearchQueries([]);
    setError(null);

    try {
      const response = await fetch(`/api/search/${id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to start follow-up");
      if (!response.body) throw new Error("No response body");

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (eventType === "status") {
                setStatus(data);
                const q = extractSearchQuery(data.message);
                if (q) setSearchQueries((prev) => (prev.includes(q) ? prev : [...prev, q]));
              } else if (eventType === "delta") {
                setSynthesis((prev) => prev + data.content);
              } else if (eventType === "complete") {
                setResult(data);
                setIsSearching(false);
              } else if (eventType === "error") {
                setError(data.message);
                setIsSearching(false);
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "An error occurred during follow-up");
        setIsSearching(false);
      }
    }
  }, []);

  const stopSearch = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsSearching(false);
  }, []);

  return {
    startSearch,
    startFollowUp,
    stopSearch,
    isSearching,
    synthesis,
    status,
    searchQueries,
    result,
    error,
  };
}
