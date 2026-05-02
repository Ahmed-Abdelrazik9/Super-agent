import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Search, History, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Search, label: "Search" },
    { href: "/history", icon: History, label: "History" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2 text-primary">
          <Zap className="h-6 w-6" />
          <span className="font-mono font-bold text-xl tracking-tight">NexusSearch</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 text-xs text-muted-foreground font-mono">
          <div className="flex items-center justify-between mb-2">
            <span>System Status</span>
            <span className="text-green-500">Online</span>
          </div>
          <div className="flex items-center justify-between">
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
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={cn(
                "text-muted-foreground hover:text-foreground",
                (location === item.href || (item.href !== "/" && location.startsWith(item.href))) && "text-primary"
              )}>
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>
        </header>

        <div className="flex-1 overflow-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
}
