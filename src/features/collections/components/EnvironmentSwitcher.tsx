import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { Select } from "@/components/ui/select";

export function EnvironmentSwitcher() {
  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId,
  );
  const setActiveEnvironment = useWorkspaceStore(
    (state) => state.setActiveEnvironment,
  );

  return (
    <Select
      value={activeEnvironmentId}
      onChange={(event) => setActiveEnvironment(event.target.value)}
      className="w-[180px]"
      aria-label="Active environment"
      data-testid="environment-switcher"
    >
      {environments.map((environment) => (
        <option key={environment.id} value={environment.id}>
          {environment.name}
        </option>
      ))}
    </Select>
  );
}
