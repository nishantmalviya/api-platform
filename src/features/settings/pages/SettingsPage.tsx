import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

export function SettingsPage() {
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);

  return (
    <div className="min-h-screen w-full bg-background p-10 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium">Appearance</h2>
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium">Security</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Secrets are stored in the operating system credential store and are
            never persisted in plain text in local storage. Agent tool calls
            require explicit approval and redaction.
          </p>
        </div>
      </div>
    </div>
  );
}
