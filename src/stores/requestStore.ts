import { create } from "zustand";
import { produce } from "immer";

export interface ApiRequest {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers: { key: string; value: string }[];
  body?: string;
}

interface RequestState {
  request: ApiRequest;
  setRequest: (request: Partial<ApiRequest>) => void;
  resetRequest: () => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  request: {
    method: "GET",
    url: "",
    headers: [],
    body: "",
  },
  setRequest: (request) =>
    set(
      produce((state) => {
        state.request = { ...state.request, ...request };
      })
    ),
  resetRequest: () =>
    set(
      produce((state) => {
        state.request = {
          method: "GET",
          url: "",
          headers: [],
          body: "",
        };
      })
    ),
}));