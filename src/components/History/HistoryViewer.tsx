"use client"
import React from "react";
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { makeRequest } from "@/lib/axios";
import {  LIMIT, containerVariants } from "@/lib/constants";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";
import { HistoryResponse } from "@/types";
import { Pagination } from "./Pagination";
import { FilterPanel } from "./FilterPanel";
import { SearchBar } from "./SearchBar";
import { HistoryList } from "./HistoryList";

export default function HistoryViewer() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: historyData, isLoading, error: historyError } = useQuery<HistoryResponse, Error>({
    queryKey: ["history", page],
    queryFn: async () => {
      const res = await makeRequest({
        method: "GET",
        url: `/requests/history?page=${page}&limit=${LIMIT}`,
      });
      return res.data;
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
      queryClient.setQueryData(["history", page], (oldData: HistoryResponse | undefined) => {
        if (!oldData) return oldData;
        const updatedData = oldData.data.filter((entry) => entry._id !== id);
        if (updatedData.length === 0 && page > 1) {
          setPage((prev) => Math.max(prev - 1, 1));
        }
        return {
          ...oldData,
          data: updatedData,
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total - 1,
          },
        };
      });
      toast.success("History item deleted successfully");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Failed to delete history item";
      setError(errorMessage);
      toast.error(errorMessage);
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const history = useMemo(() => {
    if (!historyData?.data) return [];
    return historyData.data.filter((entry) => {
      const matchesSearch = entry.url
        ? entry.url.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
      const matchesMethod = filterMethod ? entry.method === filterMethod : true;
      return matchesSearch && matchesMethod;
    });
  }, [historyData, searchTerm, filterMethod]);

  const totalPages = useMemo(
    () => Math.ceil((historyData?.pagination?.total || 0) / LIMIT),
    [historyData]
  );

  const toggleAccordion = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const clearAllHistory = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleConfirmClear = useCallback(async () => {
    const toastId = toast.loading("Clearing history...");
    try {
      await makeRequest({ method: "DELETE", url: "/requests/history?all=true" });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      setPage(1);
      toast.success("History cleared successfully", { id: toastId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to clear history";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setIsModalOpen(false);
    }
  }, [queryClient]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFilterChange = useCallback((method: string) => {
    setFilterMethod(method);
  }, []);

  return (
    <motion.div
      className="p-4 sm:p-6 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <h3 className="text-xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-100 text-center sm:text-left">
        Request History
      </h3>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
        <FilterPanel
          filterMethod={filterMethod}
          onFilterChange={handleFilterChange}
          onClearAll={clearAllHistory}
          isClearDisabled={history.length === 0}
        />
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center py-10">
          <svg
            className="animate-spin h-10 w-10 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Loading history...</p>
        </div>
      ) : historyError ? (
            <p className="mt-4 text-center text-red-600 dark:text-red-400 font-semibold">{historyError.message}</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400 py-10 text-lg">No history found.</p>
      ) : (
        <>
          <HistoryList
            history={history}
            expandedId={expandedId}
            onToggle={toggleAccordion}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
      {error && <p className="mt-4 text-center text-red-600 dark:text-red-400 font-semibold">{error}</p>}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmClear}
      />
    </motion.div>
  );
}