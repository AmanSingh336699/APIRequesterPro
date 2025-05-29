'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { IScanResult } from '@/models/ScanResult'; 

ChartJS.register(ArcElement, Tooltip, Legend);

interface ScoreMeterProps {
    scanResult: IScanResult;
}

export default function ScoreMeter({ scanResult }: ScoreMeterProps) {
    const score = useMemo(() => {
        const highCount = scanResult?.results?.filter((r) => r.severity === 'high')?.length ?? 0;
        const mediumCount = scanResult?.results?.filter((r) => r.severity === 'medium')?.length ?? 0;
        return Math.max(0, 100 - highCount * 20 - mediumCount * 10);
    }, [scanResult]);

    const data = useMemo(() => ({
        datasets: [
            {
                data: [score, 100 - score], 
                backgroundColor: ['#10B981', '#E5E7EB'], 
                borderColor: ['#10B981', '#E5E7EB'],
                borderWidth: 1,
            },
        ],
    }), [score]);

    const options = useMemo(() => ({
        circumference: 180,
        rotation: -90, 
        cutout: '70%',
        plugins: {
            legend: { display: false }, 
            tooltip: { enabled: false }, 
        },
        maintainAspectRatio: false, 
        responsive: true, 
    }), []);

    return (
        <motion.div
            className="w-full max-w-xs mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Security Score</h3>
            <div className="relative w-48 h-24"> 
                <Doughnut data={data} options={options} />
                <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {score}<span className="text-xl font-semibold">/100</span>
                </p>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                A higher score indicates better API security.
            </p>
        </motion.div>
    );
}