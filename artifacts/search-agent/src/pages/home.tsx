import { useState } from "react";
import Layout from "@/components/layout";
import { SearchBar, type SearchMode } from "@/components/search-bar";
import { SearchProgress } from "@/components/search-progress";
import { useSearchStream } from "@/hooks/use-search-stream";
import { useLocation } from "wouter";

export default function Home() {
  const {
    startSearch, stopSearch,
    isSearching, status, searchQueries, synthesis,
  } = useSearchStream();
  const [, setLocation] = useLocation();
  const [activeMode, setActiveMode] = useState<SearchMode>("deep");

  const handleSearch = (query: string, mode: SearchMode) => {
    setActiveMode(mode);
    if (mode === "images") {
      setLocation(`/images?q=${encodeURIComponent(query)}`);
    } else {
      startSearch(query, mode as any);
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col items-center px-6 max-w-4xl mx-auto w-full">

        {/* ── Hero ── */}
        {!isSearching && (
          <div className="w-full text-center mt-20 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-3">
              <span className="text-foreground">Nexus</span>
              <span className="text-primary">Search</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              AI-powered deep research. Search anything, get everything.
            </p>
          </div>
        )}

        {isSearching && <div className="mt-10 w-full" />}

        {/* ── Search bar ── */}
        <div className={`w-full mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 ${isSearching ? "max-w-3xl mx-auto" : ""}`}>
          <SearchBar
            onSearch={handleSearch}
            onStop={stopSearch}
            isSearching={isSearching}
          />
        </div>

        {/* ── Live search progress ── */}
        {isSearching && (
          <div className="w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SearchProgress
              query={status?.message.startsWith("Initiating") ? "Searching..." : synthesis ? synthesis.slice(0, 80) : (searchQueries[0] ?? "...")}
              mode={activeMode as any}
              status={status}
              searchQueries={searchQueries}
              synthesis={synthesis}
            />
          </div>
        )}


      </div>
    </Layout>
  );
}
