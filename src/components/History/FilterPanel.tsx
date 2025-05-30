"use client"
import { HTTP_METHODS } from "@/lib/constants";
import React from "react";

interface FilterPanelProps {
  filterMethod: string;
  onFilterChange: (method: string) => void;
  onClearAll: () => void;
  isClearDisabled: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = React.memo(
  ({ filterMethod, onFilterChange, onClearAll, isClearDisabled }) => {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <select
          value={filterMethod}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full sm:w-auto"
          aria-label="Filter history by HTTP method"
        >
          <option value="">All Methods</option>
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
        <button
          onClick={onClearAll}
          disabled={isClearDisabled}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          aria-label="Clear all history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
            />
          </svg>
          Clear All
        </button>
      </div>
    );
  }
);
FilterPanel.displayName = "FilterPanel";