"use client";

import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRequestStore } from "@/stores/requestStore";
import { useEnvStore } from "@/stores/envStore";
import { sendRequestSchema, saveRequestSchema } from "@/validators/request.schema";
import { makeRequest } from "@/lib/axios";
import { parseRequest } from "@/utils/requestUtils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ResponseViewer } from "@/components/ResponseViewer";
import LoadTester from "@/components/LoadTester";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Save, Send, Loader2, XCircle, Info } from "lucide-react";
import { z } from "zod";
import { validateUrl } from "@/utils/helper";

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

type SendRequestFormData = z.infer<typeof sendRequestSchema>;
type SaveRequestFormData = z.infer<typeof saveRequestSchema>;

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

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

  const sendForm = useForm<SendRequestFormData>({
    resolver: zodResolver(sendRequestSchema),
    defaultValues: request,
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
      const parsedData = parseRequest(data, envVariables);
      validateUrl(parsedData.url);

      const startTime = Date.now();
      const requestBody = parseJsonBody(parsedData.body);

      const res = await makeRequest({
        method: parsedData.method,
        url: parsedData.url,
        headers: parsedData.headers?.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}) || {},
        data: requestBody,
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
          headers: parsedData.headers?.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
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
      setError(error.message || "Failed to fetch the API response. Please check the URL and try again.");
      setResponse(null);
      toast.error(error.message || "Failed to send request.");
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
      setRequest(data);
      setError(null);
      sendMutation.mutate(data);
      saveForm.reset({ ...data, collectionId: "", name: "" });
    },
    [setRequest, sendMutation, saveForm]
  );

  const onSaveSubmit = useCallback(
    (data: SaveRequestFormData) => {
      saveMutation.mutate(data);
    },
    [saveMutation]
  );

  const addHeader = useCallback(() => {
    setRequest({ headers: [...(request.headers || []), { key: "", value: "" }] });
  }, [setRequest, request.headers]);

  const removeHeader = useCallback(
    (indexToRemove: number) => {
      const updatedHeaders = (request.headers || []).filter((_, index) => index !== indexToRemove);
      setRequest({ headers: updatedHeaders });
    },
    [setRequest, request.headers]
  );

  const requestForLoadTest = useMemo(() => {
    if (!sendForm.formState.isValid) return undefined;

    const values = sendForm.getValues();
    return {
      method: values.method,
      url: values.url,
      headers: values.headers ?? [],
      body: values.body,
    };
  }, [
    sendForm.formState.isValid,
    sendForm.watch("method"),
    sendForm.watch("url"),
    sendForm.watch("headers"),
    sendForm.watch("body"),
  ]);


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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
              <div className="flex-shrink-0 w-full sm:w-32 md:w-36">
                <select
                  {...sendForm.register("method")}
                  className="w-full h-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-medium shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out appearance-none cursor-pointer pr-8 sm:pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1.2em",
                  }}
                  aria-label="Select HTTP method"
                >
                  {HTTP_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                {...sendForm.register("url")}
                placeholder="Enter URL (e.g., {{base_url}}/endpoint)"
                error={sendForm.formState.errors.url?.message}
                className="flex-1 text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out"
                aria-describedby={sendForm.formState.errors.url ? "url-error" : undefined}
              />
              <div className="flex flex-row gap-2 sm:gap-3">
                <Button
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-1 sm:gap-2"
                  aria-label="Send request"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                  )}
                  <span className="text-sm sm:text-base">
                    {sendMutation.isPending ? "Sending..." : "Send"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsSaveModalOpen(true)}
                  disabled={collections.length === 0}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out shadow-md dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700 flex items-center justify-center gap-1 sm:gap-2"
                  aria-label="Save request"
                >
                  <Save className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="text-sm sm:text-base">Save</span>
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-inner border border-gray-100 dark:border-gray-700 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
              <label className="block text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                Headers
              </label>
              <div className="space-y-2 sm:space-y-3">
                {request.headers?.map((_, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                    <Input
                      {...sendForm.register(`headers.${index}.key`)}
                      placeholder="Key"
                      className="flex-1 text-sm sm:text-base py-2 px-3 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition duration-200"
                      aria-label={`Header ${index + 1} key`}
                    />
                    <Input
                      {...sendForm.register(`headers.${index}.value`)}
                      placeholder="Value"
                      className="flex-1 text-sm sm:text-base py-2 px-3 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition duration-200"
                      aria-label={`Header ${index + 1} value`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeHeader(index)}
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition duration-200 ease-in-out rounded-lg"
                      aria-label={`Remove header ${index + 1}`}
                    >
                      <Trash2 className="h-4 sm:h-5 w-4 sm:w-5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addHeader}
                className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out dark:bg-indigo-800 dark:text-indigo-100 dark:hover:bg-indigo-700 flex items-center justify-center gap-1 sm:gap-2"
                aria-label="Add new header"
              >
                <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
                <span className="text-sm sm:text-base">Add Header</span>
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-inner border border-gray-100 dark:border-gray-700">
              <label className="block text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                Body
              </label>
              <textarea
                {...sendForm.register("body")}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 sm:px-4 py-2 sm:py-3 min-h-[120px] sm:min-h-[160px] resize-y font-mono text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out"
                placeholder="Request Body (JSON)"
                aria-label="Request body JSON"
                aria-describedby={sendForm.formState.errors.body ? "body-error" : undefined}
              />
              {sendForm.formState.errors.body && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 sm:mt-2 flex items-center gap-1" id="body-error">
                  <XCircle className="h-4 w-4" /> {sendForm.formState.errors.body.message}
                </p>
              )}
            </div>
          </form>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
            {requestForLoadTest && <LoadTester request={requestForLoadTest} />}
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

      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl sm:shadow-3xl p-4 sm:p-6 max-w-[90vw] sm:max-w-md w-full max-h-[80vh] overflow-y-auto transform scale-95 opacity-0 animate-scale-in ring-1 ring-gray-100 dark:ring-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
              Save Request
            </h3>
            <form onSubmit={saveForm.handleSubmit(onSaveSubmit)} className="space-y-4 sm:space-y-6">
              {collectionsLoading ? (
                <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2">
                  <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" /> Loading collections...
                </p>
              ) : collections.length === 0 ? (
                <p className="text-red-600 dark:text-red-400 text-sm sm:text-base text-center p-3 sm:p-4 border border-red-300 dark:border-red-700 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900 flex items-center justify-center gap-1 sm:gap-2">
                  <Info className="h-4 sm:h-5 w-4 sm:w-5" />
                  No collections found. Please create a collection in the "Collections" tab first.
                </p>
              ) : (
                <div className="relative">
                  <select
                    {...saveForm.register("collectionId")}
                    className="w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out appearance-none cursor-pointer pr-8 sm:pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.5rem center",
                      backgroundSize: "1.2em",
                    }}
                    aria-label="Select collection"
                    aria-describedby={saveForm.formState.errors.collectionId ? "collection-error" : undefined}
                  >
                    <option value="">Select Collection</option>
                    {collections.map((col) => (
                      <option key={col._id} value={col._id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                  {saveForm.formState.errors.collectionId && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1 sm:mt-2 flex items-center gap-1" id="collection-error">
                      <XCircle className="h-4 w-4" /> {saveForm.formState.errors.collectionId.message}
                    </p>
                  )}
                </div>
              )}
              <Input
                {...saveForm.register("name")}
                placeholder="Request Name"
                error={saveForm.formState.errors.name?.message}
                className="text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out"
                aria-label="Request name"
                aria-describedby={saveForm.formState.errors.name ? "name-error" : undefined}
              />
              <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  aria-label="Cancel save"
                >
                  <span className="text-sm sm:text-base">Cancel</span>
                </Button>
                <Button
                  type="submit"
                  disabled={collections.length === 0 || saveMutation.isPending}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-1 sm:gap-2"
                  aria-label="Save request"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                  ) : (
                    <Save className="h-4 sm:h-5 w-4 sm:w-5" />
                  )}
                  <span className="text-sm sm:text-base">{saveMutation.isPending ? "Saving..." : "Save"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}