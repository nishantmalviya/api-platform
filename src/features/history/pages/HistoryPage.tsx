import { HistoryPanel } from "@/features/history/components/HistoryPanel";

export function HistoryPage() {
  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center border-b border-border px-4">
        <h1 className="text-sm font-semibold">Request History</h1>
      </header>
      <div className="min-h-0 flex-1">
        <HistoryPanel />
      </div>
    </div>
  );
}
