import { ApiRequest } from "@/types";

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"] as const;

export const DEFAULT_REQUEST: ApiRequest = {
  method: "GET",
  url: "",
  headers: [],
  body: "",
};

export const DEFAULT_ENVIRONMENT = {
  _id: "default",
  name: "default",
  variables: [{ key: "base_url", value: "https://api.example.com" }],
};

export const MAX_HISTORY_ITEMS = 50;

export const RATE_LIMIT_CONFIG = {
  points: 10,
  duration: 60, 
};

export const LIMIT = 10;

export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, ease: "easeOut" },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const accordionVariants = {
  open: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.3 } },
};
