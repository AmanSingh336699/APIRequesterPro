"use client";
import { useState, useCallback } from "react";
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
import { z } from "zod";
import LoadTester from "@/components/LoadTester";

type SendRequestFormData = z.infer<typeof sendRequestSchema>;
type SaveRequestFormData = z.infer<typeof saveRequestSchema>;

interface ApiResponse {
  success: boolean;
  data: any;
  status: number;
  headers: Record<string, string>;
  time: number;
}

export default function RequestForm() {
  const queryClient = useQueryClient();
  const { request, setRequest } = useRequestStore();
  const { environments, selectedEnvironment } = useEnvStore();
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await makeRequest({
        method: "GET",
        url: "/collections",
      });
      return res.data || [];
    },
  });

  const sendForm = useForm<SendRequestFormData>({
    resolver: zodResolver(sendRequestSchema),
    defaultValues: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
    },
  });

  const saveForm = useForm<SaveRequestFormData>({
    resolver: zodResolver(saveRequestSchema),
    defaultValues: {
      collectionId: "",
      name: "",
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SendRequestFormData) => {
      const env = environments.find((e) => e.name === selectedEnvironment);
      const parsedData = parseRequest(data, env?.variables || []);
      try {
        new URL(parsedData.url);
      } catch (error) {
        throw new Error("The resolved URL is invalid. Please ensure all placeholders are defined correctly");
      }
      const startTime = Date.now();
      let requestBody;
      try {
        requestBody = parsedData.body ? JSON.parse(parsedData.body) : undefined;
      } catch (error) {
        throw new Error("Invalid JSON body. Please check the syntax and try again.");
      }
      const res = await makeRequest({
        method: parsedData.method,
        url: parsedData.url,
        headers: parsedData.headers?.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}) || {},
        data: requestBody,
      });
      const result = {
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
    },
    onError: (error: any) => {
      setError(error.message || "Failed to fetch the API response. Please check the URL and try again.");
      setResponse(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SaveRequestFormData) => {
      return makeRequest({
        method: "POST",
        url: "/requests",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setIsSaveModalOpen(false);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to save the request.");
    },
  });

  const onSendSubmit = useCallback(
    (data: SendRequestFormData) => {
      setRequest(data);
      setError(null);
      mutation.mutate(data);

      saveForm.setValue("method", data.method);
      saveForm.setValue("url", data.url);
      saveForm.setValue("headers", data.headers);
      saveForm.setValue("body", data.body);
    },
    [setRequest, mutation, saveForm]
  );

  const onSaveSubmit = useCallback(
    (data: SaveRequestFormData) => {
      saveMutation.mutate(data);
    },
    [saveMutation]
  );

  type CustomRequest = {
    method: string;
    url: string;
    headers: { key: string; value: string }[];
    body?: string;
  };

  const isFormValid = sendForm.formState.isValid;
  const requestForLoadTest: CustomRequest | undefined = isFormValid
    ? {
        method: sendForm.getValues().method,
        url: sendForm.getValues().url,
        headers: sendForm.getValues().headers ?? [],
        body: sendForm.getValues().body,
      }
    : undefined;


  return (
    <div className="card">
      <form onSubmit={sendForm.handleSubmit(onSendSubmit)}>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
          <select {...sendForm.register("method")} className="w-full md:w-32">
            {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Input
            {...sendForm.register("url")}
            placeholder="Enter URL (e.g., {{base_url}}/endpoint)"
            error={sendForm.formState.errors.url?.message}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setIsSaveModalOpen(true)}>
            Save
          </Button>
        </div>
        <div className="mb-4">
          <label>Headers</label>
          {request.headers.map((_, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <Input {...sendForm.register(`headers.${index}.key`)} placeholder="Key" />
              <Input {...sendForm.register(`headers.${index}.value`)} placeholder="Value" />
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => setRequest({ headers: [...request.headers, { key: "", value: "" }] })}
          >
            Add Header
          </Button>
        </div>
        <div className="mb-4">
          <label>Body</label>
          <textarea
            {...sendForm.register("body")}
            className="input h-32"
            placeholder="Request Body (JSON)"
          />
          {sendForm.formState.errors.body && (
            <p className="text-red-500">{sendForm.formState.errors.body.message}</p>
          )}
        </div>
      </form>

      <div className="mt-6">
        <LoadTester
          request={requestForLoadTest}
        />
      </div>

      {mutation.isPending && (
        <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 rounded">
          <p>Loading...</p>
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 rounded">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {response && !error && <ResponseViewer response={response} />}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="card">
            <h3 className="text-lg mb-4">Save Request</h3>
            <form onSubmit={saveForm.handleSubmit(onSaveSubmit)}>
              {collectionsLoading ? (
                <p>Loading collections...</p>
              ) : collections?.length === 0 ? (
                <p className="text-red-500 mb-4">
                  No collections found. Please create a collection in the "Collections" tab first.
                </p>
              ) : (
                <select {...saveForm.register("collectionId")} className="input mb-4">
                  <option value="">Select Collection</option>
                  {collections.map((col: any) => (
                    <option key={col._id} value={col._id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              )}
              {saveForm.formState.errors.collectionId && (
                <p className="text-red-500 text-sm mb-2">
                  {saveForm.formState.errors.collectionId.message}
                </p>
              )}
              <Input
                {...saveForm.register("name")}
                placeholder="Request Name"
                error={saveForm.formState.errors.name?.message}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="secondary" onClick={() => setIsSaveModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={collections?.length === 0 || saveMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}