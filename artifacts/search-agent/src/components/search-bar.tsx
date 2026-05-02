import { useState } from "react";
import { Search, Zap, Layers, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string, mode: "quick" | "deep" | "expert") => void;
  onStop?: () => void;
  isSearching: boolean;
  initialQuery?: string;
  initialMode?: "quick" | "deep" | "expert";
}

export function SearchBar({ onSearch, onStop, isSearching, initialQuery = "", initialMode = "deep" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<"quick" | "deep" | "expert">(initialMode);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching) {
      onStop?.();
    } else if (query.trim()) {
      onSearch(query, mode);
    }
  };

  const modes = [
    { id: "quick", label: "Quick", icon: Zap },
    { id: "deep", label: "Deep", icon: Layers },
    { id: "expert", label: "Expert", icon: Brain },
  ] as const;

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "relative flex flex-col w-full max-w-3xl mx-auto rounded-xl border bg-card/50 backdrop-blur-md transition-all duration-300",
        isFocused ? "border-primary shadow-[0_0_30px_rgba(0,255,255,0.15)] bg-card" : "border-border shadow-lg"
      )}
    >
      <div className="flex items-center px-4 py-3">
        <Search className={cn("h-6 w-6 mr-3 transition-colors", isFocused ? "text-primary" : "text-muted-foreground")} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything..."
          className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          disabled={isSearching}
        />
        <Button
          type="submit"
          disabled={!isSearching && !query.trim()}
          className={cn(
            "ml-2 transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]",
            isSearching
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_rgba(255,60,60,0.3)]"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          data-testid="button-search-submit"
        >
          {isSearching ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
              Stop
            </span>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 border-t border-border pt-3">
        <span className="text-xs font-mono text-muted-foreground mr-2">MODE:</span>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            disabled={isSearching}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border disabled:opacity-50",
              mode === m.id 
                ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(0,255,255,0.1)]" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            )}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>
    </form>
  );
}
