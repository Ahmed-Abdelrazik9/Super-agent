import { useGetTrendingTopics, useGetSearchStats } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { SearchBar } from "@/components/search-bar";
import { useSearchStream } from "@/hooks/use-search-stream";
import { Activity, Database, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: trendingTopics } = useGetTrendingTopics();
  const { data: searchStats } = useGetSearchStats();
  const { startSearch, isSearching, status, synthesis } = useSearchStream();

  return (
    <Layout>
      <div className="h-full flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
        
        <div className="w-full text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            Nexus<span className="text-primary">Search</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-mono max-w-2xl mx-auto">
            Elite intelligence for power users.
          </p>
        </div>

        <div className="w-full mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
          <SearchBar onSearch={startSearch} isSearching={isSearching} />
          
          {isSearching && status && (
            <div className="mt-6 p-4 rounded-lg bg-card/50 border border-primary/30 w-full max-w-3xl mx-auto">
              <div className="flex items-center gap-3 text-primary mb-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                <span className="font-mono text-sm">{status.phase.toUpperCase()}: {status.message}</span>
              </div>
              {synthesis && (
                <p className="text-sm text-muted-foreground line-clamp-2">{synthesis}</p>
              )}
            </div>
          )}
        </div>

        {!isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
            
            {/* Trending Topics */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <TrendingUp className="h-5 w-5" />
                <h2 className="font-mono text-sm uppercase tracking-wider">Trending Intelligence</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTopics?.topics?.map((topic) => (
                  <button
                    key={topic.topic}
                    onClick={() => startSearch(topic.topic, "deep")}
                    className="px-4 py-2 rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/10 text-sm transition-all text-foreground text-left flex flex-col"
                  >
                    <span className="font-medium">{topic.topic}</span>
                    <span className="text-xs text-muted-foreground font-mono mt-1">{topic.category} • {topic.searchCount.toLocaleString()} queries</span>
                  </button>
                ))}
              </div>
            </div>

            {/* System Stats */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Activity className="h-5 w-5" />
                <h2 className="font-mono text-sm uppercase tracking-wider">System Telemetry</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card/50 backdrop-blur border-border">
                  <CardContent className="p-4 flex flex-col">
                    <Database className="h-5 w-5 text-primary mb-2" />
                    <span className="text-2xl font-bold font-mono">
                      {searchStats?.totalSources ? (searchStats.totalSources / 1000000).toFixed(1) + 'M' : '---'}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">Sources Indexed</span>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border">
                  <CardContent className="p-4 flex flex-col">
                    <Clock className="h-5 w-5 text-primary mb-2" />
                    <span className="text-2xl font-bold font-mono">
                      {searchStats?.avgDuration ? (searchStats.avgDuration / 1000).toFixed(2) + 's' : '---'}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">Avg Query Time</span>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
