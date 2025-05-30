"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponseViewer } from "@/components/ResponseViewer";
import { HistoryEntry } from "@/types";

interface HistoryItemProps {
  entry: HistoryEntry;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = React.memo(
  ({ entry, expandedId, onToggle, onDelete, isDeleting }) => {
    const getStatusColor = (status: number) => {
      if (status >= 200 && status < 300) return "bg-green-500";
      if (status >= 300 && status < 400) return "bg-yellow-500";
      if (status >= 400) return "bg-red-500";
      return "bg-gray-400";
    };

    return (
      <motion.li
        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div
            className="flex flex-col sm:flex-row flex-wrap items-center gap-2 cursor-pointer flex-grow"
            onClick={() => onToggle(entry._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onToggle(entry._id);
            }}
            aria-expanded={expandedId === entry._id}
            aria-controls={`response-${entry._id}`}
          >
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-white ${
                entry.method === "GET"
                  ? "bg-blue-500"
                  : entry.method === "POST"
                    ? "bg-green-500"
                    : entry.method === "PUT"
                      ? "bg-yellow-500"
                      : entry.method === "DELETE"
                        ? "bg-red-500"
                        : "bg-gray-400"
              }`}
            >
              {entry.method}
            </span>
            <span className="truncate max-w-[14rem] sm:max-w-[25rem] text-gray-800 dark:text-gray-200 font-mono text-sm">
              {entry.url}
            </span>
            <span
              className={`ml-auto px-2 py-1 rounded-md text-white text-xs font-semibold ${getStatusColor(
                entry.response?.status || 0
              )}`}
              title={`Status: ${entry.response?.status || "N/A"}`}
            >
              {entry.response?.status || "-"}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap ml-2">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => onDelete(entry._id)}
            disabled={isDeleting}
            aria-label="Delete request history"
            className="text-red-600 hover:text-red-800 dark:hover:text-red-400 transition rounded p-1 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {isDeleting ? (
              <svg
                className="animate-spin h-6 w-6 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
        <AnimatePresence>
          {expandedId === entry._id && (
            <motion.div
              key={`response-${entry._id}`}
              variants={{
                collapsed: { opacity: 0, height: 0 },
                open: { opacity: 1, height: "auto" },
              }}
              initial="collapsed"
              animate="open"
              exit="collapsed"
              className="mt-4 border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-100 dark:bg-gray-900 max-h-72 overflow-auto font-mono text-xs text-gray-800 dark:text-gray-200"
              id={`response-${entry._id}`}
            >
              <ResponseViewer response={entry.response} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.li>
    );
  }
);
HistoryItem.displayName = "HistoryItem";