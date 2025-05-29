'use client'

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import ResultCard from '@/components/scanner/ResultCard';
import ScoreMeter from '@/components/scanner/ScoreMeter';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { makeRequest } from '@/lib/axios';
import { IScanResult } from '@/models/ScanResult';

export default function ScanResultPage() {
    const { id } = useParams();

    const fetchScanResult = async (): Promise<IScanResult> => {
        const response = await makeRequest({ method: 'GET', url: `requests/scan/${id}/result` });
        return response.data as IScanResult;
    };

    const { data: scanResult, isLoading, error } = useQuery<IScanResult, Error>({
        queryKey: ['scanResult', id],
        queryFn: fetchScanResult,
        staleTime: 1000 * 60 * 5,
        retry: false,
    });

    const downloadPDF = () => {
        if (!scanResult) return;
        const doc = new jsPDF();
        let y = 10;

        doc.setFontSize(22);
        doc.setTextColor(30, 58, 138);
        doc.text(`API Security Scan Report`, 10, y);
        y += 10;

        doc.setFontSize(12);
        doc.setTextColor(75, 85, 99);
        doc.text(`Target URL: ${scanResult.url}`, 10, y);
        y += 7;
        doc.text(`Scan Date: ${new Date(scanResult.timestamp).toLocaleString()}`, 10, y);
        y += 15;

        const highCount = scanResult.results.filter((r) => r.severity === 'high').length;
        const mediumCount = scanResult.results.filter((r) => r.severity === 'medium').length;
        const score = Math.max(0, 100 - highCount * 20 - mediumCount * 10);
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text(`Overall Security Score: ${score}/100`, 10, y);
        y += 15;

        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(`Detailed Findings:`, 10, y);
        y += 10;

        scanResult.results.forEach((result, index) => {
            if (y > doc.internal.pageSize.height - 40) {
                doc.addPage();
                y = 10;
                doc.setFontSize(16);
                doc.setTextColor(15, 23, 42);
                doc.text(`Detailed Findings (cont.):`, 10, y);
                y += 10;
            }

            doc.setFontSize(12);
            doc.setTextColor(31, 41, 55);
            doc.text(`${index + 1}. ${result.name}`, 10, y);
            y += 7;

            let severityColor;
            switch (result.severity) {
                case 'high':
                    severityColor = [220, 38, 38];
                    break;
                case 'medium':
                    severityColor = [245, 158, 11];
                    break;
                case 'low':
                    severityColor = [16, 185, 129];
                    break;
                default:
                    severityColor = [107, 114, 128];
            }
            doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
            doc.text(`Severity: ${result.severity.toUpperCase()}`, 15, y);
            y += 7;

            doc.setTextColor(55, 65, 81);
            doc.text(`Description:`, 15, y);
            doc.setFontSize(10);
            doc.text(doc.splitTextToSize(result.description, doc.internal.pageSize.width - 30), 15, y + 5);
            y += doc.splitTextToSize(result.description, doc.internal.pageSize.width - 30).length * 4 + 7;

            doc.setFontSize(12);
            doc.setTextColor(55, 65, 81);
            doc.text(`Recommendation:`, 15, y);
            doc.setFontSize(10);
            doc.text(doc.splitTextToSize(result.recommendation, doc.internal.pageSize.width - 30), 15, y + 5);
            y += doc.splitTextToSize(result.recommendation, doc.internal.pageSize.width - 30).length * 4 + 10;
        });

        doc.save(`api-scan-report-${id}.pdf`);
    };

    if (isLoading)
        return <div className="text-center p-8 text-xl text-indigo-600 dark:text-indigo-400 animate-pulse">Loading scan results...</div>;
    if (error)
        return (
            <div className="text-center p-8 text-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md mx-4 sm:mx-auto max-w-md">
                <p className="font-semibold mb-2">Error loading scan results!</p>
                <p className="text-base">{error.message}</p>
            </div>
        );
    if (!scanResult)
        return <div className="text-center p-8 text-xl text-gray-700 dark:text-gray-300">No scan results found for this ID.</div>;

    return (
        <motion.div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-gray-200 dark:border-gray-800">
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 text-center">
                    API Security Scan for <span className="text-indigo-600 dark:text-indigo-400">{scanResult.url}</span>
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-md sm:text-lg">
                    Comprehensive analysis of your API&apos;s security posture.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    <motion.div
                        className="md:col-span-1 flex justify-center sticky top-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <ScoreMeter scanResult={scanResult} />
                    </motion.div>

                    <div className="md:col-span-2">
                        <motion.button
                            onClick={downloadPDF}
                            className="w-full mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-offset-gray-900 transition-all duration-300 ease-in-out"
                            whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Download PDF Report
                        </motion.button>

                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
                            Findings
                        </h2>
                        <div className="space-y-5">
                            {scanResult.results.length > 0 ? (
                                scanResult.results.map((result, index) => <ResultCard key={index} {...result} />)
                            ) : (
                                <p className="text-center text-lg text-gray-600 dark:text-gray-400 py-8">
                                    No specific security vulnerabilities were identified in this scan.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
