'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { makeRequest } from '@/lib/axios';
import { IScanResult } from '@/models/ScanResult';
import { History, Link as LinkIcon, Calendar, Eye, Send, ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface ScanHistoryResponse {
    scans: IScanResult[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function HistoryTable() {
    const { data: session, status } = useSession();
    const [page, setPage] = useState(1);
    const [inputValue, setInputValue] = useState('');
    const debouncedValue = useDebounce(inputValue, 500);
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState<{
        field: 'url' | 'timestamp';
        direction: 'ascending' | 'descending';
    }>({ field: 'timestamp', direction: 'descending' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [scanToDelete, setScanToDelete] = useState<string | null>(null);
    const itemsPerPage = 7;
    const queryClient = useQueryClient();
    useEffect(() => {
        setSearchTerm(debouncedValue);
    }, [debouncedValue]);

    const mapDirectionToSortOrder = (direction: 'ascending' | 'descending'): 'asc' | 'desc' => {
        return direction === 'ascending' ? 'asc' : 'desc';
    };

    const fetchHistory = async ({ queryKey }: { queryKey: any }) => {
        const [, currentPage, userId, search, sortField, sortDir] = queryKey;
        console.log('Fetch history params:', { currentPage, userId, search, sortField, sortDir });
        if (!userId) return { scans: [], pagination: { page: 1, limit: itemsPerPage, total: 0, totalPages: 1 } };

        const url = `requests/scan/history?page=${Number(currentPage)}&limit=${itemsPerPage}&search=${encodeURIComponent(search || '')}&sortBy=${sortField}&sortOrder=${mapDirectionToSortOrder(sortDir)}`;
        try {
            const response = await makeRequest({
                method: 'GET',
                url,
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch scan history: ${response.status}`);
            }
            return response.data as ScanHistoryResponse;
        } catch (err: any) {
            console.error('Fetch error:', err.response?.data || err.message);
            toast.error(err.response?.data?.error || 'Error fetching scan history. Please try again.');
            throw err;
        }
    };

    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ['scanHistory', page, session?.user?.id, searchTerm, sort.field, sort.direction],
        queryFn: fetchHistory,
        enabled: status === 'authenticated' && !!session?.user?.id,
        staleTime: 1000 * 60 * 2,
    });

    const scans = data?.scans || [];
    const totalPages = data?.pagination?.totalPages || 1;

    const deleteScanById = async (scanId: string) => {
        const toastId = toast.loading('Deleting scan...');
        const previousScans = scans;
        queryClient.setQueryData(['scanHistory', page, session?.user?.id, searchTerm, sort.field, sort.direction], {
            scans: scans.filter((s) => s._id !== scanId),
            pagination: data?.pagination,
        });

        try {
            const response = await makeRequest({
                method: 'DELETE',
                url: `/requests/scan/history?scanId=${scanId}`,
            });
            if (response.status === 200) {
                toast.success('Scan deleted successfully', { id: toastId });
                queryClient.invalidateQueries({ queryKey: ['scanHistory', page, session?.user?.id] });
            }
        } catch{
            toast.error('Failed to delete scan. Please try again.', { id: toastId });
            queryClient.setQueryData(['scanHistory', page, session?.user?.id, searchTerm, sort.field, sort.direction], {
                scans: previousScans,
                pagination: data?.pagination,
            });
        }
    };

    const deleteAllScans = async () => {
        const toastId = toast.loading('Deleting all scans...');
        try {
            const response = await makeRequest({
                method: 'DELETE',
                url: `/requests/scan/history`,
            });
            if (response.status === 200) {
                toast.success('All scans deleted successfully', { id: toastId });
                queryClient.invalidateQueries({ queryKey: ['scanHistory', page, session?.user?.id] });
            }
        } catch{
            toast.error('Failed to delete all scans. Please try again.', { id: toastId });
        }
    };

    const handleSort = (field: 'url' | 'timestamp') => {
        setSort({
            field,
            direction: sort.field === field && sort.direction === 'ascending' ? 'descending' : 'ascending',
        });
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg">
                <svg className="w-12 h-12 animate-spin text-blue-500 mr-3" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="25" cy="25" r="20" stroke="#3B82F6" strokeWidth="4" strokeDasharray="31.4 31.4" />
                    <path d="M25 5A20 20 0 0 1 45 25" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading session...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl max-w-md mx-auto mt-10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
            >
                <svg className="w-16 h-16 mx-auto mb-4 text-blue-500" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="28" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
                    <path d="M32 20C28.4 20 25 23.6 25 28C25 32.4 28.4 36 32 36C35.6 36 39 32.4 39 28C39 23.6 35.6 20 32 20ZM32 44C24.8 44 19 38.2 19 31H15C15 40.4 22.6 48 32 48C41.4 48 49 40.4 49 31H45C45 38.2 39.2 44 32 44Z" fill="#3B82F6" />
                </svg>
                <p className="text-xl font-semibold mb-3">Authentication Required</p>
                <p className="mb-6">Please log in to your account to view your API scan history.</p>
                <Link href="/auth/signin">
                    <motion.button
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-300 ease-in-out"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Sign In
                    </motion.button>
                </Link>
            </motion.div>
        );
    }

    if (isLoading || isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg">
                <svg className="w-12 h-12 animate-spin text-blue-500 mr-3" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="25" cy="25" r="20" stroke="#3B82F6" strokeWidth="4" strokeDasharray="31.4 31.4" />
                    <path d="M25 5A20 20 0 0 1 45 25" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading scan history...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg text-red-500 dark:text-red-400">
                <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="28" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
                    <path d="M32 18V36M32 44H32.01" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <p className="text-lg font-semibold">Failed to load history</p>
                <p>There was an error fetching your scan history. Please check your network and try again.</p>
            </div>
        );
    }

    return (
        <motion.div
            className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-50 flex items-center gap-3">
                    <History className="h-8 w-8 text-blue-600" /> API Scan History
                </h2>
                {scans.length > 0 && (
                    <div className="flex gap-2">
                        <motion.button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Trash2 className="h-5 w-5" /> Delete All
                        </motion.button>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <div className="relative max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by API URL..."
                        value={inputValue}
                        autoFocus
                        onChange={(e) => {
                            setInputValue(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        aria-label="Search API scan history by URL"
                    />
                </div>
            </div>

            {scans.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center p-12 bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 flex flex-col items-center justify-center"
                >
                    <svg className="w-32 h-32 mb-6 opacity-80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="15" y="15" width="70" height="70" rx="10" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="2" />
                        <path d="M50 30V70M30 50H70" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                    <p className="text-xl font-semibold mb-3">No Scan History Found</p>
                    <p className="max-w-md mb-6">It looks like you haven't performed any API scans yet. Start a new scan to see your results here!</p>
                    <Link href="/scan">
                        <motion.button
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Send className="h-5 w-5" /> Start New Scan
                        </motion.button>
                    </Link>
                </motion.div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400" aria-label="API Scan History">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-4 py-3 sm:px-6">
                                        <span className="sr-only">Icon</span>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 sm:px-6 cursor-pointer"
                                        onClick={() => handleSort('url')}
                                        aria-sort={sort.field === 'url' ? sort.direction : 'none'}
                                    >
                                        API URL
                                        {sort.field === 'url' && (
                                            sort.direction === 'ascending' ? (
                                                <ChevronUp className="inline h-4 w-4 ml-1" />
                                            ) : (
                                                <ChevronDown className="inline h-4 w-4 ml-1" />
                                            )
                                        )}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 sm:px-6 cursor-pointer"
                                        onClick={() => handleSort('timestamp')}
                                        aria-sort={sort.field === 'timestamp' ? sort.direction : 'none'}
                                    >
                                        Scan Date
                                        {sort.field === 'timestamp' && (
                                            sort.direction === 'ascending' ? (
                                                <ChevronUp className="inline h-4 w-4 ml-1" />
                                            ) : (
                                                <ChevronDown className="inline h-4 w-4 ml-1" />
                                            )
                                        )}
                                    </th>
                                    <th scope="col" className="px-4 py-3 sm:px-6 text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.map((scan) => (
                                    <motion.tr
                                        key={scan._id as string}
                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                    >
                                        <td className="px-4 py-4 sm:px-6">
                                            <LinkIcon className="h-5 w-5 text-blue-500" />
                                        </td>
                                        <td className="px-4 py-4 sm:px-6 font-medium text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
                                            {scan.url}
                                        </td>
                                        <td className="px-4 py-4 sm:px-6 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {new Date(scan.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 sm:px-6 text-center space-x-2">
                                            <Link href={`/scan/${scan._id}/result`}>
                                                <motion.button
                                                    className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Eye className="h-4 w-4 mr-1 sm:mr-2" /> View
                                                </motion.button>
                                            </Link>
                                            <motion.button
                                                onClick={() => {
                                                    setScanToDelete(scan._id as string);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-200"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> Delete
                                            </motion.button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <motion.button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow"
                            whileHover={{ scale: page === 1 ? 1 : 1.05 }}
                            whileTap={{ scale: page === 1 ? 1 : 0.95 }}
                        >
                            <ChevronLeft className="h-5 w-5" /> Previous
                        </motion.button>
                        <span className="text-gray-700 dark:text-gray-300 text-base sm:text-lg font-semibold">
                            Page {page} of {totalPages}
                        </span>
                        <motion.button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= totalPages}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow"
                            whileHover={{ scale: page >= totalPages ? 1 : 1.05 }}
                            whileTap={{ scale: page >= totalPages ? 1 : 0.95 }}
                        >
                            Next <ChevronRight className="h-5 w-5" />
                        </motion.button>
                    </div>
                </>
            )}

            {showDeleteModal && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
                            {scanToDelete ? 'Delete Scan' : 'Delete All Scans'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to {scanToDelete ? 'delete this scan' : 'delete all scans'}? This action cannot be undone.
                        </p>
                        <div className="flex gap-4 justify-end">
                            <motion.button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setScanToDelete(null);
                                }}
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                onClick={async () => {
                                    if (scanToDelete) {
                                        await deleteScanById(scanToDelete);
                                    } else {
                                        await deleteAllScans();
                                    }
                                    setShowDeleteModal(false);
                                    setScanToDelete(null);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Delete
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}