import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const ip = typeof window !== "undefined" ? window.location.hostname : "server";
  await rateLimiter.consume(ip);
  return config;
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) return true;
  const status = error.response.status;
  return status >= 500 || status === 429;
};

const makeRequest = async (
  config: AxiosRequestConfig,
  retryCount = 3,
  retryDelay = 1000
): Promise<any> => {
  let attempt = 0;
  while (attempt <= retryCount) {
    try {
      const response = await api({ ...config, timeout: 10000 });
      return response;
    } catch (error: any) {
      const axiosError = error as AxiosError;

      if (attempt === retryCount || !isRetryableError(axiosError)) {
        let message: string;
        const data = axiosError.response?.data;
        if (data && typeof data === "object" && "message" in data) {
          message = (data as { message: string }).message;
        } else {
          message = axiosError.message || "Request failed";
        }
        throw new Error(message);
      }

      const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 300;
      console.warn(`Retry attempt ${attempt + 1}/${retryCount} in ${Math.round(delay)}ms`);
      await sleep(delay);
      attempt++;
    }
  }
};

export { makeRequest };
export default api;
