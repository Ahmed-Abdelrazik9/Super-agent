import { useListSearchHistory, useDeleteSearch, getListSearchHistoryQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Search, Zap, Layers, Brain, Trash2, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HistoryPage() {
  const { data, isLoading } = useListSearchHistory({ limit: 50 });
  const deleteSearch = useDeleteSearch();
  const queryClient = useQueryClient();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the search
    e.stopPropagation();
    deleteSearch.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSearchHistoryQueryKey() });
      }
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'quick': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'expert': return <Brain className="w-4 h-4 text-purple-500" />;
      default: return <Layers className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Search History</h1>
          <p className="text-muted-foreground font-mono text-sm">Your past queries and analyses.</p>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[40%]">Query</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Sources</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full max-w-[300px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No search history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items?.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/search/${item.id}`} className="block">
                          <span className="block text-foreground group-hover:text-primary transition-colors">
                            {item.query}
                          </span>
                          <span className="block text-xs text-muted-foreground font-normal line-clamp-1 mt-1">
                            {item.previewText}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 capitalize text-xs font-mono">
                          {getModeIcon(item.mode)}
                          {item.mode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded inline-flex">
                          <FileText className="w-3 h-3" />
                          {item.sourceCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(item.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
