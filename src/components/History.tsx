"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { makeRequest } from "@/lib/axios";
import { ResponseViewer } from "./ResponseViewer";

const LIMIT = 5;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const accordionVariants = {
    open: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
    closed: { height: 0, opacity: 0, transition: { duration: 0.3 } },
};

interface HistoryEntry {
    _id: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    url: string;
    headers?: Record<string, string>;
    body?: string;
    status: number;
    response: any;
    duration: number;
    createdAt: string;
}

export default function HistoryViewer() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const {
        data: historyData,
        isLoading,
        error: historyError,
    } = useQuery({
        queryKey: ["history", page],
        queryFn: async () => {
            const res = await makeRequest({
                method: "GET",
                url: `/requests/history?page=${page}&limit=${LIMIT}`,
            });
            return res.data
        },
        staleTime: 60000,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            setDeletingId(id);
            await makeRequest({
                method: "DELETE",
                url: `/requests/history`,
                data: { id },
            });
        },
        onSuccess: (_, id) => {
            queryClient.setQueryData(["history", page], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    data: oldData.data.filter((entry: HistoryEntry) => entry._id !== id),
                    pagination: {
                        ...oldData.pagination,
                        total: oldData.pagination.total - 1,
                    },
                };
            });

            const currentTotal = history?.length || 0;
            if (currentTotal === 1 && page > 1) {
                setPage((prev) => prev - 1);
            }
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || "Failed to delete history item");
        },
        onSettled: () => {
            setDeletingId(null);
        },
    });

    const history: HistoryEntry[] = historyData?.data || [];
    const totalPages = Math.ceil((historyData?.pagination?.total || 0) / LIMIT);

    const toggleAccordion = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <motion.div
            className="p-4 sm:p-6 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 dark:text-gray-100">Request History</h3>

            {isLoading ? (
                <div className="flex justify-center items-center py-8 sm:py-10">
                    <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="ml-2 sm:ml-3 text-gray-600 dark:text-gray-300 text-sm sm:text-base">Loading history...</span>
                </div>
            ) : historyError ? (
                <p className="text-red-500 dark:text-red-400 text-center text-sm sm:text-base">{historyError.message}</p>
            ) : history.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-4 text-sm sm:text-base">No history found.</p>
            ) : (
                <>
                    <motion.ul className="space-y-3" variants={itemVariants}>
                        <AnimatePresence>
                            {history.map((entry) => (
                                <motion.li
                                    key={entry._id}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                                    variants={itemVariants}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => toggleAccordion(entry._id)}
                                        >
                                            <p className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">
                                                {entry.url}
                                            </p>
                                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                <span className={`font-semibold ${entry.method === "GET" ? "text-green-500" : entry.method === "POST" ? "text-blue-500" : entry.method === "PUT" ? "text-yellow-500" : entry.method === "DELETE" ? "text-red-500" : "text-purple-500"}`}>
                                                    {entry.method}
                                                </span>
                                                <span>| Status: {entry.status}</span>
                                                <span>| Duration: {entry.duration}ms</span>
                                                <span>| {new Date(entry.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <motion.button
                                            onClick={() => deleteMutation.mutate(entry._id)}
                                            disabled={deletingId === entry._id}
                                            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-md transition-all duration-300
                        ${deletingId === entry._id
                                                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 active:scale-95"
                                                } text-white`}
                                            whileHover={{ scale: deletingId === entry._id ? 1 : 1.02 }}
                                            whileTap={{ scale: deletingId === entry._id ? 1 : 0.98 }}
                                        >
                                            {deletingId === entry._id ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin h-4 w-4 mr-1 sm:mr-2 text-white" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Deleting...
                                                </span>
                                            ) : (
                                                "Delete"
                                            )}
                                        </motion.button>
                                    </div>
                                    <AnimatePresence>
                                        {expandedId === entry._id && (
                                            <motion.div
                                                className="mt-3 overflow-hidden"
                                                initial="closed"
                                                animate="open"
                                                exit="closed"
                                                variants={accordionVariants}
                                            >
                                                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                    <ResponseViewer response={{ ...entry.response, time: entry.duration }} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </motion.ul>

                    <div className="flex justify-center items-center space-x-2 sm:space-x-3 mt-4 sm:mt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {error && (
                <motion.p
                    className="text-red-500 dark:text-red-400 mt-4 text-center text-sm sm:text-base"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.p>
            )}
        </motion.div>
    );
}