import { ApiRequest } from "@/types";

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

export const DEFAULT_REQUEST: ApiRequest = {
  method: "GET",
  url: "",
  headers: [],
  body: "",
  preScript: "",
  testScript: "",
};

export const DEFAULT_ENVIRONMENT = {
  name: "default",
  variables: [{ key: "base_url", value: "https://api.example.com" }],
};

export const MAX_HISTORY_ITEMS = 50;

export const RATE_LIMIT_CONFIG = {
  points: 10, // 10 requests
  duration: 60, // per minute
};