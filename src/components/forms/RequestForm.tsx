"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRequestStore } from "@/stores/requestStore";
import { useEnvStore } from "@/stores/envStore";
import { sendRequestSchema, saveRequestSchema } from "@/validators/request.schema";
import { makeRequest } from "@/lib/axios";
import { parseRequest } from "@/utils/requestUtils";
import { toast } from "react-hot-toast";
import { Loader2, XCircle } from "lucide-react";
import { z } from "zod";
import { validateUrl } from "@/utils/helper";
import RequestFormHeader from "../Request/RequestFormHeader";
import HeadersSection from "../Request/HeadersSection";
import BodySection from "../Request/BodySection";
import SaveRequestModal from "../Request/SaveModal";
import LoadTester from "@/components/LoadTester";
import { ResponseViewer } from "@/components/ResponseViewer";

interface ApiResponse {
  success: boolean;
  data: unknown;
  status: number;
  headers: Record<string, string>;
  time: number;
}

interface Collection {
  _id: string;
  name: string;
}

export type SendRequestFormData = z.infer<typeof sendRequestSchema>;
export type SaveRequestFormData = z.infer<typeof saveRequestSchema>;

const parseJsonBody = (body: string | undefined) => {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON body. Please check the syntax and try again.");
  }
};

export default function RequestForm() {
  const queryClient = useQueryClient();
  const { request, setRequest } = useRequestStore();
  const { environments, selectedEnvironment } = useEnvStore();
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const envVariables = useMemo(
    () => environments.find((e) => e.name === selectedEnvironment)?.variables || [],
    [environments, selectedEnvironment]
  );

  const { data: collections = [], isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await makeRequest({ method: "GET", url: "/collections" });
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const sendForm = useForm<SendRequestFormData, any, SendRequestFormData>({
    resolver: zodResolver(sendRequestSchema),
    defaultValues: {
      ...request,
      headers: request.headers ?? [],
    },
    mode: "onChange",
  });

  const saveForm = useForm<SaveRequestFormData>({
    resolver: zodResolver(saveRequestSchema),
    defaultValues: {
      collectionId: "",
      name: "",
      ...request,
    },
    mode: "onChange",
  });

  const sendMutation = useMutation({
    mutationFn: async (data: SendRequestFormData) => {
      abortControllerRef.current = new AbortController();
      console.log("before parsed", data)
      const parsedData = parseRequest(data, envVariables);
      console.log("parsed data", parsedData)
      validateUrl(parsedData.url);

      const headers = parsedData.headers?.length
        ? parsedData.headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})
        : {};

      const startTime = Date.now();
      const requestBody = parseJsonBody(parsedData.body);

      const res = await makeRequest({
        method: parsedData.method,
        url: parsedData.url,
        headers,
        data: requestBody,
        signal: abortControllerRef.current.signal,
      });

      const result: ApiResponse = {
        success: true,
        data: res.data,
        status: res.status,
        headers: Object.fromEntries(
          Object.entries(res.headers).map(([k, v]) => [k, v?.toString() ?? ""])
        ),
        time: Date.now() - startTime,
      };

      await makeRequest({
        method: "POST",
        url: "/requests/history",
        data: {
          method: parsedData.method,
          url: parsedData.url,
          headers,
          body: parsedData.body,
          status: res.status,
          response: result.data,
          duration: result.time,
        },
      });

      return result;
    },
    onSuccess: (response) => {
      setResponse(response);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Request sent successfully!");
    },
    onError: (error: Error) => {
      if (error.name === "AbortError") {
        setError("Request was canceled.");
        toast.error("Request was canceled.");
      } else {
        setError(error.message || "Failed to fetch the API response. Please check the URL and try again.");
        toast.error(error.message || "Failed to send request.");
      }
      setResponse(null);
    },
    onSettled: () => {
      abortControllerRef.current = null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SaveRequestFormData) => {
      await makeRequest({
        method: "POST",
        url: "/requests",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setIsSaveModalOpen(false);
      saveForm.reset();
      toast.success("Request saved successfully!");
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to save the request.");
      toast.error(error.message || "Failed to save request.");
    },
  });

  const onSendSubmit = useCallback(
    (data: SendRequestFormData) => {
      setRequest({
        ...data,
        headers: (data.headers ?? []).filter(
          (h): h is { key: string; value: string } =>
            typeof h.key === "string" && typeof h.value === "string"
        ),
      });
      setError(null);
      sendMutation.mutate(data);
      saveForm.reset({ ...data, collectionId: "", name: "" });
    },
    [setRequest, sendMutation, saveForm]
  );

  const onCancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast.dismiss("Request canceled.");
    }
  }, []);

  const onSaveSubmit = useCallback(
    (data: SaveRequestFormData) => {
      saveMutation.mutate(data);
    },
    [saveMutation]
  );

  const requestForLoadTest = useMemo(() => {
    if (!sendForm.formState.isValid) return undefined;

    const values = sendForm.getValues();
    return {
      method: values.method,
      url: values.url,
      headers: (values.headers ?? []).filter((header) => header.key?.trim()),
      body: values.body,
    };
  }, [
    sendForm.formState.isValid,
    sendForm.watch("method"),
    sendForm.watch("url"),
    sendForm.watch("headers"),
    sendForm.watch("body"),
  ]);;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-950 dark:to-slate-900 p-2 sm:p-4 md:p-6 lg:p-8 font-sans">
      <svg className="absolute inset-0 z-0 opacity-20 dark:hidden" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="15vw" cy="10vh" r="10vw" fill="url(#gradient1)" opacity="0.3" />
        <circle cx="85vw" cy="90vh" r="15vw" fill="url(#gradient2)" opacity="0.3" />
        <defs>
          <radialGradient id="gradient1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="gradient2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      <svg className="absolute inset-0 z-0 opacity-10 hidden dark:block" width="100%" height="100%">
        <defs>
          <pattern id="grid-dark" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dark)" />
        <circle cx="10vw" cy="80vh" r="12vw" fill="url(#gradient3)" opacity="0.2" />
        <circle cx="90vw" cy="20vh" r="10vw" fill="url(#gradient4)" opacity="0.2" />
        <defs>
          <radialGradient id="gradient3" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="gradient4" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      <div className="relative z-10 max-w-[95vw] sm:max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 transition-all duration-300 ease-in-out hover:shadow-3xl">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
          <form onSubmit={sendForm.handleSubmit(onSendSubmit)} className="space-y-6 sm:space-y-8">
            <RequestFormHeader
              sendForm={sendForm}
              sendMutation={sendMutation}
              onCancelRequest={onCancelRequest}
              setIsSaveModalOpen={setIsSaveModalOpen}
              collections={collections}
            />
            <HeadersSection request={request} setRequest={setRequest} sendForm={sendForm} />
            <BodySection sendForm={sendForm} />
          </form>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
            {requestForLoadTest && (
              <LoadTester
                request={{
                  ...requestForLoadTest,
                  headers: (requestForLoadTest.headers ?? []).filter(
                    (header): header is { key: string; value: string } =>
                      typeof header.key === "string" &&
                      typeof header.value === "string"
                  ),
                }}
              />
            )}
          </div>
          {sendMutation.isPending && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-blue-50 dark:bg-blue-950 rounded-lg sm:rounded-xl text-blue-700 dark:text-blue-200 text-center shadow-md animate-pulse flex items-center justify-center gap-2 sm:gap-3">
              <Loader2 className="h-5 sm:h-6 w-5 sm:w-6 animate-spin text-blue-500" />
              <p className="text-sm sm:text-base font-medium">Sending request...</p>
            </div>
          )}
          {error && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-red-50 dark:bg-red-950 rounded-lg sm:rounded-xl text-red-700 dark:text-red-200 shadow-md flex items-center gap-2 sm:gap-3">
              <XCircle className="h-5 sm:h-6 w-5 sm:w-6 text-red-500" />
              <div>
                <p className="font-bold text-sm sm:text-base mb-1">Error:</p>
                <p className="text-sm sm:text-base">{error}</p>
              </div>
            </div>
          )}
          {response && !error && <ResponseViewer response={response} />}
        </div>
      </div>
      <SaveRequestModal
        isSaveModalOpen={isSaveModalOpen}
        setIsSaveModalOpen={setIsSaveModalOpen}
        saveForm={saveForm}
        onSaveSubmit={onSaveSubmit}
        collections={collections}
        collectionsLoading={collectionsLoading}
        saveMutation={saveMutation}
      />
    </div>
  );
}