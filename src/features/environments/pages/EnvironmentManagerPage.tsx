import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EnvironmentManagerPage() {
  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore((state) => state.activeEnvironmentId);
  const setActiveEnvironment = useWorkspaceStore((state) => state.setActiveEnvironment);
  const upsertEnvironment = useWorkspaceStore((state) => state.upsertEnvironment);
  const deleteEnvironment = useWorkspaceStore((state) => state.deleteEnvironment);
  const setEnvironmentVariables = useWorkspaceStore(
    (state) => state.setEnvironmentVariables,
  );

  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>(
    activeEnvironmentId,
  );

  const selected =
    environments.find((item) => item.id === selectedEnvironmentId) ??
    environments[0];

  const addEnvironment = () => {
    const environment = {
      id: `env_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: `New Environment ${environments.length + 1}`,
      variables: [{ key: "baseUrl", value: "http://localhost:8080", secret: false }],
    };
    upsertEnvironment(environment);
    setSelectedEnvironmentId(environment.id);
    setActiveEnvironment(environment.id);
  };

  const updateVariable = (
    index: number,
    patch: { key?: string; value?: string; secret?: boolean },
  ) => {
    if (!selected) return;
    setEnvironmentVariables(
      selected.id,
      selected.variables.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const removeVariable = (index: number) => {
    if (!selected) return;
    setEnvironmentVariables(
      selected.id,
      selected.variables.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const addVariable = () => {
    if (!selected) return;
    setEnvironmentVariables(selected.id, [
      ...selected.variables,
      { key: "", value: "", secret: false },
    ]);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <h1 className="text-sm font-semibold">Environments</h1>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={addEnvironment}
          data-testid="add-environment-button"
        >
          <Plus className="h-3.5 w-3.5" />
          New environment
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-2">
            <select
              value={selected?.id ?? ""}
              onChange={(event) => setSelectedEnvironmentId(event.target.value)}
              className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm"
              data-testid="environment-manager-select"
            >
              {environments.map((environment) => (
                <option key={environment.id} value={environment.id}>
                  {environment.name}
                </option>
              ))}
            </select>
            {selected ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteEnvironment(selected.id)}
                data-testid="delete-environment-button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}
          </div>

          {selected ? (
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-2">
                <h2 className="text-sm font-medium">{selected.name}</h2>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-xs text-muted-foreground">
                  Environment variables are injected into requests as{" "}
                  <code className="font-mono">{"{{key}}"}</code> placeholders and are
                  resolved against the active environment.
                </p>
                <div className="space-y-2">
                  {selected.variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={variable.key}
                        onChange={(event) =>
                          updateVariable(index, { key: event.target.value })
                        }
                        placeholder="KEY"
                        className="h-8 w-56 font-mono text-xs"
                        data-testid={`variable-key-${index}`}
                      />
                      <Input
                        value={variable.value}
                        onChange={(event) =>
                          updateVariable(index, { value: event.target.value })
                        }
                        placeholder="value"
                        className="h-8 w-96 font-mono text-xs"
                        data-testid={`variable-value-${index}`}
                      />
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={variable.secret}
                          onChange={(event) =>
                            updateVariable(index, { secret: event.target.checked })
                          }
                          className="h-4 w-4"
                        />
                        secret
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariable(index)}
                        aria-label="Remove variable"
                        data-testid={`remove-variable-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariable}
                  data-testid="add-variable-button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add variable
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
