import { create } from "zustand";
import { produce } from "immer";
import { DEFAULT_ENVIRONMENT } from "@/lib/constants";

export interface Environment {
  _id: string
  name: string;
  variables: { key: string; value: string }[];
}

interface EnvState {
  environments: Environment[];
  selectedEnvironment: string | null;
  setEnvironments: (environments: Environment[]) => void;
  setSelectedEnvironment: (name: string | null) => void;
}

export const useEnvStore = create<EnvState>((set) => ({
  environments: [],
  selectedEnvironment: null,
  setEnvironments: (environments) =>
    set(
      produce((state) => {
        state.environments = environments;
        if (environments.length > 0 && !state.selectedEnvironment) {
          state.selectedEnvironment = environments[0].name;
        } else if (environments.length === 0){
          state.environments = [
            DEFAULT_ENVIRONMENT,
          ];
          state.selectedEnvironment = "Default"
        }
      })
    ),
  setSelectedEnvironment: (name) =>
    set(
      produce((state) => {
        state.selectedEnvironment = name;
      })
    ),
}));