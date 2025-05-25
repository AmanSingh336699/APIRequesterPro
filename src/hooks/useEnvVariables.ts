import { useEnvStore } from "@/stores/envStore";

export function useEnvVariables() {
  const { environments, selectedEnvironment, updateVariable } = useEnvStore();
  const currentEnv = environments.find((e) => e.name === selectedEnvironment);

  return {
    variables: currentEnv?.variables || [],
    updateVariable: (key: string, value: string) => updateVariable(selectedEnvironment, key, value),
  };
}