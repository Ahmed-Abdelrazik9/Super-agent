import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Zap, Plus, Trash2, Clock, Layers, Brain, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useListSearchHistory,
  getListSearchHistoryQueryKey,
  useDeleteSearch,
  useUpdateSearch,
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

function SidebarItem({
  item,
  isActive,
  onDelete,
  onRename,
}: {
  item: { id: number; query: string; title?: string | null; mode: string };
  isActive: boolean;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}) {
  const href = `/search/${item.id}`;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = item.title || item.query;

  function startEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDraft(displayName);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft("");
  }

  function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== displayName) {
      onRename(trimmed);
    }
    setEditing(false);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") cancelEdit();
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div
      data-testid={`sidebar-search-${item.id}`}
      className={cn(
        "group flex items-center gap-1.5 w-full rounded-md px-2 py-2 text-left transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {editing ? (
        <>
          <ModeIcon mode={item.mode} />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            className="flex-1 min-w-0 bg-background border border-primary/40 rounded px-1.5 py-0.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/60"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); commitEdit(); }}
            className="shrink-0 p-0.5 rounded text-green-500 hover:text-green-400"
            title="Save"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
            className="shrink-0 p-0.5 rounded hover:text-destructive"
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <>
          <Link href={href} className="flex items-center gap-2 flex-1 min-w-0">
            <ModeIcon mode={item.mode} />
            <span className="truncate text-sm leading-snug">{displayName}</span>
          </Link>
          <button
            data-testid={`button-rename-search-${item.id}`}
            onClick={startEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:text-primary"
            title="Rename"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            data-testid={`button-delete-search-${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
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

  const updateSearch = useUpdateSearch({
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
                <SidebarItem
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  onDelete={() => deleteSearch.mutate({ id: item.id })}
                  onRename={(title) => updateSearch.mutate({ id: item.id, data: { title } })}
                />
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
