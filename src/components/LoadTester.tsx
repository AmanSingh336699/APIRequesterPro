"use client";
import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { useEnvStore } from "@/stores/envStore";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import Input from "./ui/Input";
import { makeRequest } from "@/lib/axios";
import { validateUrl } from "@/utils/helper";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

interface LoadTestResult {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    throughput: number;
}

interface PerRequestMetric {
    requestIndex: number;
    method: string;
    url: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
}

interface LoadTestResponse {
    metrics: LoadTestResult;
    perRequestMetrics: PerRequestMetric[];
    results: Array<{ requestIndex: number; status: number; time: number; error?: string }>;
    id: string;
}

interface LoadTesterProps {
    request?: Request;
    collection?: Collection;
}

export default function LoadTester({ request, collection }: LoadTesterProps) {
    const [loadTestResponse, setLoadTestResponse] = useState<LoadTestResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof PerRequestMetric;
        direction: "asc" | "desc";
    } | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [concurrency, setConcurrency] = useState(1);
    const [iterations, setIterations] = useState(10);
    const { selectedEnvironment } = useEnvStore();
    const requestsPerPage = 5;

    const runLoadTestMutation = useMutation({
        mutationFn: async () => {
            const payload: any = {
                concurrency,
                iterations,
                environment: selectedEnvironment,
            };

            if (request) {
                payload.request = request;
            } else if (collection) {
                payload.collectionId = collection._id;
            }
            const res = await makeRequest({
                method: "POST",
                url: "/loadtest",
                data: payload
            })
            return res.data;
        },
        onSuccess: (data) => {
            setLoadTestResponse(data);
            setError(null);
            setCurrentPage(1);
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || "Failed to run load test");
            setLoadTestResponse(null);
        },
    });

    const handleRunLoadTest = () => {
        if (!request && !collection) {
            setError("No request or collection provided for load testing");
            setLoadTestResponse(null);
            return;
        }
        if (request && collection) {
            setError("Provide either a request or a collection, not both");
            setLoadTestResponse(null);
            return;
        }
        if (!selectedEnvironment) {
            setError("No environment selected. Please select an environment.");
            setLoadTestResponse(null);
            return;
        }
        if (concurrency < 1 || iterations < 1) {
            setError("Concurrency and iterations must be positive numbers");
            setLoadTestResponse(null);
            return;
        }
        runLoadTestMutation.mutate();
    };

    const totalPages = Math.ceil((loadTestResponse?.perRequestMetrics?.length || 0) / requestsPerPage);
    const paginatedMetrics = useMemo(() => {
        if (!loadTestResponse?.perRequestMetrics) return [];
        const startIndex = (currentPage - 1) * requestsPerPage;
        const endIndex = startIndex + requestsPerPage;
        return loadTestResponse.perRequestMetrics.slice(startIndex, endIndex);
    }, [loadTestResponse, currentPage]);

    const sortedMetrics = useMemo(() => {
        if (!paginatedMetrics.length || !sortConfig) return paginatedMetrics;
        return [...paginatedMetrics].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [paginatedMetrics, sortConfig]);

    const handleSort = (key: keyof PerRequestMetric) => {
        setSortConfig((prev) => ({
            key,
            direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const chartData = useMemo(() => {
        if (!loadTestResponse?.perRequestMetrics) return null;
        return {
            labels: loadTestResponse.perRequestMetrics.map((m) => `Request ${m.requestIndex + 1}`),
            datasets: [
                {
                    label: "Avg Response Time (ms)",
                    data: loadTestResponse.perRequestMetrics.map((m) => m.avgResponseTime),
                    borderColor: "rgba(59, 130, 246, 1)",
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    fill: false,
                    tension: 0.3,
                },
                {
                    label: "Error Rate (%)",
                    data: loadTestResponse.perRequestMetrics.map((m) => m.errorRate),
                    borderColor: "rgba(239, 68, 68, 1)",
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    fill: false,
                    tension: 0.3,
                },
            ],
        };
    }, [loadTestResponse]);

    return (
        <motion.div
            className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h4 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white">Load Testing Dashboard</h4>

            <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
                <div className="flex-1">
                    <label htmlFor="concurrency-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Concurrency
                    </label>
                    <Input
                        id="concurrency-input"
                        type="number"
                        value={concurrency}
                        onChange={(e) => setConcurrency(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        min="1"
                        aria-label="Concurrency"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="iterations-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Iterations
                    </label>
                    <Input
                        id="iterations-input"
                        type="number"
                        value={iterations}
                        onChange={(e) => setIterations(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        min="1"
                        aria-label="Iterations"
                    />
                </div>
                <div className="lg:self-end">
                    <Button
                        onClick={handleRunLoadTest}
                        disabled={
                            runLoadTestMutation.isPending ||
                            (!request && !collection) ||
                            (!!request && !!collection) ||
                            !selectedEnvironment ||
                            concurrency < 1 ||
                            iterations < 1
                        }
                        className="w-full lg:w-auto bg-blue-600 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                        aria-label="Run load test"
                    >
                        {runLoadTestMutation.isPending ? (
                            <span className="flex items-center">
                                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Running...
                            </span>
                        ) : (
                            "Run Load Test"
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <motion.div
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </motion.div>
            )}

            {loadTestResponse && !error && (
                <div className="space-y-6">
                    {/* Aggregated Results */}
                    <motion.div
                        className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h5 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                            Aggregated Results
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Total Requests", value: loadTestResponse.metrics?.totalRequests || 0 },
                                { label: "Successful Requests", value: loadTestResponse.metrics?.successfulRequests || 0 },
                                { label: "Failed Requests", value: loadTestResponse.metrics?.failedRequests || 0 },
                                { label: "Avg Response Time", value: `${loadTestResponse.metrics?.avgResponseTime?.toFixed(2) || 0} ms` },
                                { label: "Min Response Time", value: `${loadTestResponse.metrics?.minResponseTime || 0} ms` },
                                { label: "Max Response Time", value: `${loadTestResponse.metrics?.maxResponseTime || 0} ms` },
                                { label: "Error Rate", value: `${loadTestResponse.metrics?.errorRate?.toFixed(2) || 0}%` },
                                { label: "Throughput", value: `${loadTestResponse.metrics?.throughput?.toFixed(2) || 0} req/s` },
                            ].map((item, index) => (
                                <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.label}</p>
                                    <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Per-Request Results (Expandable) */}
                    {loadTestResponse.perRequestMetrics && loadTestResponse.perRequestMetrics.length > 0 && (
                        <motion.div
                            className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden" // Added overflow-hidden here
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                                <h5 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                    Per-Request Results
                                </h5>
                                <Button
                                    onClick={() => setExpanded(!expanded)}
                                    className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                                    aria-label={expanded ? "Collapse detailed results" : "Expand detailed results"}
                                >
                                    {expanded ? "Collapse" : "Expand"} Details
                                </Button>
                            </div>

                            <AnimatePresence>
                                {expanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                        className="max-w-full" // Ensure max-width is applied
                                    >
                                        {chartData && (
                                            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                                                <h6 className="text-md sm:text-lg font-medium mb-3 text-gray-900 dark:text-white">
                                                    Response Time & Error Rate per Request
                                                </h6>
                                                <div className="h-72 sm:h-80 lg:h-96 w-full"> {/* Increased height for better visibility */}
                                                    <Line
                                                        data={chartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: "top",
                                                                    labels: {
                                                                        color: "rgb(156 163 175)", // Tailwind gray-400
                                                                    },
                                                                },
                                                                title: {
                                                                    display: false, // You have a separate h6 for the title
                                                                },
                                                                tooltip: {
                                                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                                                    titleColor: "#fff",
                                                                    bodyColor: "#fff",
                                                                },
                                                            },
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    title: {
                                                                        display: true,
                                                                        text: "Value (ms / %)", // Combined title
                                                                        color: "rgb(156 163 175)",
                                                                    },
                                                                    min: 0,
                                                                    max: Math.max(
                                                                        ...loadTestResponse.perRequestMetrics.map((m) => m.avgResponseTime),
                                                                        ...loadTestResponse.perRequestMetrics.map((m) => m.errorRate),
                                                                        100 // Ensure at least 100 for error rate
                                                                    ) * 1.1, // Add 10% padding to max value
                                                                    ticks: {
                                                                        color: "rgb(156 163 175)",
                                                                    },
                                                                    grid: {
                                                                        color: "rgba(107, 114, 128, 0.2)", // Tailwind gray-500 with transparency
                                                                    },
                                                                },
                                                                x: {
                                                                    title: {
                                                                        display: true,
                                                                        text: "Request Index",
                                                                        color: "rgb(156 163 175)",
                                                                    },
                                                                    ticks: {
                                                                        color: "rgb(156 163 175)",
                                                                    },
                                                                    grid: {
                                                                        color: "rgba(107, 114, 128, 0.2)",
                                                                    },
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-100 dark:bg-gray-600">
                                                    <tr>
                                                        {[
                                                            { key: "requestIndex", label: "Index" },
                                                            { key: null, label: "Method" },
                                                            { key: null, label: "URL" },
                                                            { key: "successfulRequests", label: "Successful" },
                                                            { key: "failedRequests", label: "Failed" },
                                                            { key: "avgResponseTime", label: "Avg Time (ms)" },
                                                            { key: null, label: "Min Time (ms)" },
                                                            { key: null, label: "Max Time (ms)" },
                                                            { key: "errorRate", label: "Error Rate (%)" },
                                                        ].map((header, index) => (
                                                            <th
                                                                key={index}
                                                                className={`px-3 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-200 uppercase tracking-wider ${header.key ? "cursor-pointer select-none" : ""
                                                                    }`}
                                                                onClick={
                                                                    header.key
                                                                        ? () => handleSort(header.key as keyof PerRequestMetric)
                                                                        : undefined
                                                                }
                                                            >
                                                                {header.label}{" "}
                                                                {sortConfig?.key === header.key &&
                                                                    (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {sortedMetrics.map((metric) => (
                                                        <tr
                                                            key={metric.requestIndex}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                                                        >
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                {metric.requestIndex + 1}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                <span className={`font-semibold ${metric.method === 'GET' ? 'text-blue-500' :
                                                                    metric.method === 'POST' ? 'text-green-500' :
                                                                        metric.method === 'PUT' ? 'text-yellow-500' :
                                                                            metric.method === 'DELETE' ? 'text-red-500' :
                                                                                'text-gray-500'
                                                                    }`}>
                                                                    {metric.method}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-800 dark:text-gray-300 text-sm truncate max-w-xs">
                                                                {metric.url}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                {metric.successfulRequests}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                {metric.failedRequests}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                {metric.avgResponseTime.toFixed(2)}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                {metric.minResponseTime}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                {metric.maxResponseTime}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-gray-300 text-sm">
                                                                {metric.errorRate.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {sortedMetrics.length === 0 && (
                                                        <tr>
                                                            <td colSpan={9} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                                No per-request metrics available for this page.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {totalPages > 1 && (
                                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
                                                <Button
                                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="w-full sm:w-auto bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                                                    aria-label="Previous page"
                                                >
                                                    Previous
                                                </Button>
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <Button
                                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="w-full sm:w-auto bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                                                    aria-label="Next page"
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
}