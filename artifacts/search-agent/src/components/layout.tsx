import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Search, Zap, Plus, Trash2, Clock, Layers, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useListSearchHistory,
  getListSearchHistoryQueryKey,
  useDeleteSearch,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: ReactNode;
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "quick") return <Zap className="h-3 w-3 shrink-0 text-yellow-500" />;
  if (mode === "expert") return <Brain className="h-3 w-3 shrink-0 text-purple-500" />;
  return <Layers className="h-3 w-3 shrink-0 text-primary" />;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const { data: historyData, isLoading } = useListSearchHistory(
    { limit: 40 },
    { query: { queryKey: getListSearchHistoryQueryKey({ limit: 40 }), refetchInterval: 5000 } }
  );

  const deleteSearch = useDeleteSearch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSearchHistoryQueryKey({ limit: 40 }) });
      },
    },
  });

  const searches = historyData?.items ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">

        {/* Logo */}
        <div className="p-5 flex items-center gap-2 text-primary border-b border-border">
          <Zap className="h-5 w-5" />
          <span className="font-mono font-bold text-lg tracking-tight">NexusSearch</span>
        </div>

        {/* New Search */}
        <div className="px-3 pt-3">
          <Link href="/">
            <button
              data-testid="button-new-search"
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors border",
                location === "/"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground border-border hover:text-foreground hover:bg-muted hover:border-border"
              )}
            >
              <Plus className="h-4 w-4" />
              New Search
            </button>
          </Link>
        </div>

        {/* Search History */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2 min-h-0">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Recent Searches
          </p>

          {isLoading && (
            <div className="space-y-1.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          )}

          {!isLoading && searches.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center leading-relaxed">
              Your searches will appear here
            </p>
          )}

          <div className="space-y-0.5">
            {searches.map((item) => {
              const href = `/search/${item.id}`;
              const isActive = location === href;
              return (
                <div
                  key={item.id}
                  data-testid={`sidebar-search-${item.id}`}
                  className={cn(
                    "group flex items-center gap-2 w-full rounded-md px-2 py-2 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Link href={href} className="flex items-center gap-2 flex-1 min-w-0">
                    <ModeIcon mode={item.mode} />
                    <span className="truncate text-sm leading-snug">{item.query}</span>
                  </Link>
                  <button
                    data-testid={`button-delete-search-${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      deleteSearch.mutate({ id: item.id });
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border text-[10px] text-muted-foreground font-mono space-y-1">
          <div className="flex justify-between">
            <span>System Status</span>
            <span className="text-green-500">Online</span>
          </div>
          <div className="flex justify-between">
            <span>Core Model</span>
            <span>Nexus-X1</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Nav */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            <span className="font-mono font-bold text-lg">NexusSearch</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/" className={cn("text-muted-foreground hover:text-foreground", location === "/" && "text-primary")}>
              <Search className="h-5 w-5" />
            </Link>
          </nav>
        </header>

        <div className="flex-1 overflow-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
}
