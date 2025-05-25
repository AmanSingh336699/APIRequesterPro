"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ResponseViewer } from "./ResponseViewer";
import LoadTester from "@/components/LoadTester";
import { useEnvStore } from "@/stores/envStore";
import Button from "@/components/ui/Button";

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Types
interface Collection {
  _id: string;
  name: string;
  requests: Request[];
}

interface Request {
  method: string;
  url: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
}

interface RequestResult {
  request: Request;
  result: {
    success: boolean;
    data?: any;
    status: number;
    headers?: Record<string, string>;
    time: number;
    error?: string;
  };
}
interface CollectionForLoadTest extends Collection {
  requests: Request[];
}

interface RawRequest {
  method?: string;
  url?: string;
  headers?: Array<{ key?: string; value?: string }>;
  body?: string;
}

export default function CollectionRunner() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isRunInProgress, setIsRunInProgress] = useState(false);
  const [requestResults, setRequestResults] = useState<RequestResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { selectedEnvironment } = useEnvStore();
  const requestsPerPage = 10;

  const { data: collections, isLoading: collectionsLoading, error: collectionsError } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await axios.get("/api/collections", { withCredentials: true });
      return res.data;
    },
  });

  const { data: requests, isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ["requests", selectedCollection],
    queryFn: async () => {
      if (!selectedCollection) return [];
      const res = await axios.get(`/api/collections/${selectedCollection}/requests`, { withCredentials: true });
      return res.data;
    },
    enabled: !!selectedCollection,
  });

  const runRequestMutation = useMutation({
    mutationFn: async (request: Request) => {
      const payload = {
        method: request.method,
        url: request.url,
        headers: request.headers || [],
        body: request.body,
        environment: selectedEnvironment,
      };
      const res = await axios.post("/api/collections/runner", payload, { withCredentials: true });
      return res.data;
    },
    onError: (error: any) => {
      setError(error.message || "Failed to run request");
    },
  });

  const runCollection = useCallback(async () => {
    if (!requests || requests.length === 0) return;

    setIsRunInProgress(true);
    setRequestResults([]);
    setError(null);

    const startIndex = (currentPage - 1) * requestsPerPage;
    const endIndex = Math.min(startIndex + requestsPerPage, requests.length);
    const requestsToRun = requests.slice(startIndex, endIndex);

    const results: RequestResult[] = [];
    for (const request of requestsToRun) {
      try {
        const result = await runRequestMutation.mutateAsync(request);
        results.push({ request, result });
      } catch (error: any) {
        results.push({
          request,
          result: {
            success: false,
            status: 0,
            time: 0,
            error: error.message || "Failed to run request",
          },
        });
      }
    }

    setRequestResults(results);
    setIsRunInProgress(false);
  }, [requests, currentPage, selectedEnvironment, runRequestMutation]);

  const retryFailedRequests = useCallback(async () => {
    const failedRequests = requestResults
      .filter((result) => !result.result.success)
      .map((result) => result.request);

    if (failedRequests.length === 0) return;

    setIsRunInProgress(true);
    setError(null);

    const results: RequestResult[] = [...requestResults];
    for (const request of failedRequests) {
      const index = results.findIndex((r) => r.request === request);
      try {
        const result = await runRequestMutation.mutateAsync(request);
        results[index] = { request, result };
      } catch (error: any) {
        results[index] = {
          request,
          result: {
            success: false,
            status: 0,
            time: 0,
            error: error.message || "Failed to run request",
          },
        };
      }
    }

    setRequestResults(results);
    setIsRunInProgress(false);
  }, [requestResults, runRequestMutation]);

  const exportToCSV = useCallback(() => {
    if (!requestResults.length) return;

    const csv = [
      "Index,Method,URL,Status,Time (ms),Error",
      ...requestResults.map((result, index) => {
        const globalIndex = (currentPage - 1) * requestsPerPage + index + 1;
        return `${globalIndex},${result.request.method},"${result.request.url}",${result.result.status},${result.result.time},"${result.result.error || ""}"`;
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collection_results_page_${currentPage}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [requestResults, currentPage]);

  const totalPages = Math.ceil((requests?.length || 0) / requestsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    setRequestResults([]);
    setExpandedRow(null);
  }, [selectedCollection]);


  const collectionForLoadTest: CollectionForLoadTest | undefined = useMemo(
    () =>
      selectedCollection && collections && requests
        ? {
          _id: selectedCollection,
          name:
            collections.find((col: any) => col._id === selectedCollection)?.name || "",
          requests: (
            (requests as RawRequest[])
              .map((req: RawRequest) => {
                if (
                  !req.method ||
                  !["GET", "POST", "PUT", "DELETE", "PATCH"].includes(req.method) ||
                  !req.url
                ) {
                  console.warn(`Invalid request in collection ${selectedCollection}:`, req);
                  return null;
                }
                return {
                  method: req.method,
                  url: req.url,
                  headers:
                    req.headers?.map((h: { key?: string; value?: string }) => ({
                      key: h.key || "",
                      value: h.value || "",
                    })) || [],
                  body: req.body || undefined,
                };
              })
              .filter((req) => req !== null)
          ) as Request[],
        }
        : undefined,
    [selectedCollection, collections, requests]
  );

  if (collectionsLoading) {
    return (
      <motion.div
        className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl flex items-center justify-center min-h-[200px] text-gray-700 dark:text-gray-300"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Loading collections...
      </motion.div>
    );
  }

  if (collectionsError) {
    return (
      <motion.div
        className="p-6 bg-red-100 dark:bg-red-800 shadow-lg rounded-xl text-red-700 dark:text-red-200"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <p>Error loading collections: {collectionsError.message}</p>
      </motion.div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <motion.div
        className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl text-gray-700 dark:text-gray-300"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <p className="text-center">No collections found. Please create a collection first.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 font-inter"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Collection Runner</h3>
      <motion.div className="mb-6" variants={itemVariants}>
        <label
          htmlFor="collection-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Select Collection
        </label>
        <select
          id="collection-select"
          value={selectedCollection || ""}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out"
          aria-label="Select a collection to run"
        >
          <option value="">-- Select a Collection --</option>
          {collections.map((col: any) => (
            <option key={col._id} value={col._id}>
              {col.name}
            </option>
          ))}
        </select>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedCollection && (
          <motion.div
            key={selectedCollection}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            {requestsLoading ? (
              <motion.p
                className="text-center text-gray-600 dark:text-gray-400 py-4 flex items-center justify-center"
                variants={itemVariants}
              >
                <svg className="animate-spin h-4 w-4 mr-2 text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading requests...
              </motion.p>
            ) : requestsError ? (
              <motion.p
                className="text-center text-red-500 dark:text-red-400 py-4"
                variants={itemVariants}
              >
                Error loading requests: {requestsError.message}
              </motion.p>
            ) : (
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Requests in collection:{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {requests?.length || 0}
                    </span>
                  </p>
                  <motion.button
                    onClick={runCollection}
                    disabled={isRunInProgress || (requests?.length || 0) === 0}
                    className={`w-full px-6 py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-300 ease-in-out
                              ${isRunInProgress || (requests?.length || 0) === 0
                        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95"
                      }`}
                    whileHover={{ scale: isRunInProgress || (requests?.length || 0) === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: isRunInProgress || (requests?.length || 0) === 0 ? 1 : 0.98 }}
                    aria-label="Run the selected collection"
                  >
                    {isRunInProgress ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-3 text-white"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Running Collection...
                      </span>
                    ) : (
                      "Run Collection"
                    )}
                  </motion.button>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mb-4">
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || isRunInProgress}
                      variant="secondary"
                      aria-label="Go to previous page"
                    >
                      Previous
                    </Button>
                    <span className="text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || isRunInProgress}
                      variant="secondary"
                      aria-label="Go to next page"
                    >
                      Next
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 rounded">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {requestResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Results (Page {currentPage})
                      </h4>
                      <div className="space-x-2">
                        <Button
                          onClick={retryFailedRequests}
                          disabled={
                            isRunInProgress ||
                            !requestResults.some((result) => !result.result.success)
                          }
                          variant="secondary"
                          aria-label="Retry failed requests"
                        >
                          Retry Failed
                        </Button>
                        <Button
                          onClick={exportToCSV}
                          disabled={isRunInProgress}
                          variant="secondary"
                          aria-label="Export results to CSV"
                        >
                          Export to CSV
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Index</th>
                            <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Method</th>
                            <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">URL</th>
                            <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Status</th>
                            <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Time (ms)</th>
                            <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestResults.map((result, index) => {
                            const globalIndex = (currentPage - 1) * requestsPerPage + index + 1;
                            return (
                              <React.Fragment key={index}>
                                <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{globalIndex}</td>
                                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{result.request.method}</td>
                                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200 truncate max-w-xs">{result.request.url}</td>
                                  <td
                                    className={`px-4 py-2 ${result.result.success
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                      }`}
                                  >
                                    {result.result.status}
                                  </td>
                                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{result.result.time}</td>
                                  <td className="px-4 py-2">
                                    <button
                                      onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                                      className="text-blue-500 hover:underline"
                                      aria-label={expandedRow === index ? "Hide details" : "Show details"}
                                    >
                                      {expandedRow === index ? "Hide" : "Show"}
                                    </button>
                                  </td>
                                </tr>

                                <AnimatePresence>
                                  {expandedRow === index && (
                                    <motion.tr
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="bg-gray-50 dark:bg-gray-600"
                                    >
                                      <td colSpan={6} className="px-4 py-2">
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                          <ResponseViewer response={result.result} />
                                        </div>
                                      </td>
                                    </motion.tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                <motion.div
                  className="pt-6 border-t border-gray-200 dark:border-gray-700"
                  variants={itemVariants}
                >
                  <LoadTester collection={collectionForLoadTest} />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}