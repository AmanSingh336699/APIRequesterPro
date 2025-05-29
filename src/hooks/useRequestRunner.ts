import { useMutation } from "@tanstack/react-query";
import { makeRequest } from "@/lib/axios";
import { useEnvStore } from "@/stores/envStore";
import { parseRequest } from "@/utils/requestUtils";

export function useRequestRunner() {
  const { environments, selectedEnvironment } = useEnvStore();

  return useMutation({
    mutationFn: async (request: any) => {
      const env = environments.find((e) => e.name === selectedEnvironment);
      const parsedRequest = parseRequest(request, env?.variables || []);
      const startTime = Date.now();
      let requestBody;
      try {
        requestBody = parsedRequest.body ? JSON.parse(parsedRequest.body) : undefined;
      } catch{
        throw new Error("Invalid JSON body. Please check the syntax and try again.");
      }
      const res = await makeRequest({
        method: parsedRequest.method,
        url: parsedRequest.url,
        headers: parsedRequest.headers?.reduce((acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {}) || {},
        data: requestBody,
      });
      await makeRequest({
        method: "POST",
        url: "/requests/history",
        data: {
          method: parsedRequest.method,
          url: parsedRequest.url,
          headers: parsedRequest.headers,
          body: parsedRequest.body,
          response: res.data,
          status: res.status,
          duration: Date.now() - startTime,
        },
      });
      return { ...res, time: Date.now() - startTime };
    },
  });
}