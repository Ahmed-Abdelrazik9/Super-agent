import { useGetTrendingTopics } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { SearchBar, type SearchMode } from "@/components/search-bar";
import { SearchProgress } from "@/components/search-progress";
import { useSearchStream } from "@/hooks/use-search-stream";
import { useLocation } from "wouter";
import { Zap, Globe, Brain } from "lucide-react";

const FEATURES = [
  { icon: Globe,  label: "Real-time web",   desc: "Live results from across the web" },
  { icon: Brain,  label: "AI synthesis",    desc: "Deep analysis, not just links" },
  { icon: Zap,    label: "Three modes",     desc: "Quick, Deep, or Expert search" },
];

export default function Home() {
  const { data: trendingTopics } = useGetTrendingTopics();
  const {
    startSearch, stopSearch,
    isSearching, status, searchQueries, synthesis,
  } = useSearchStream();
  const [, setLocation] = useLocation();

  const handleSearch = (query: string, mode: SearchMode) => {
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
              mode="deep"
              status={status}
              searchQueries={searchQueries}
              synthesis={synthesis}
            />
          </div>
        )}

        {/* ── Idle content ── */}
        {!isSearching && (
          <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/60 bg-card/60 text-sm"
                >
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-foreground text-xs">{label}</p>
                    <p className="text-muted-foreground text-[11px]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trending */}
            {trendingTopics?.topics && trendingTopics.topics.length > 0 && (
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  Trending searches
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {trendingTopics.topics.slice(0, 8).map((topic) => (
                    <button
                      key={topic.topic}
                      onClick={() => handleSearch(topic.topic, "deep")}
                      className="px-4 py-2 rounded-full border border-border/70 bg-card/50 hover:border-primary/50 hover:bg-primary/10 text-sm text-foreground/80 hover:text-foreground transition-all duration-200"
                    >
                      {topic.topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
}
