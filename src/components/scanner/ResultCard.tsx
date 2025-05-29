'use client';

import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import FixModal from './FixModal';

interface ResultCardProps {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'error';
  description: string;
  recommendation: string;
  fix?: string;
  fixLanguage?: string;
}

const ResultCard = ({ name, severity, description, recommendation, fix, fixLanguage }: ResultCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const severityStyles = {
    low: 'bg-green-50 border-green-500 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-300',
    medium: 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-300',
    high: 'bg-red-50 border-red-500 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-300',
    error: 'bg-gray-50 border-gray-500 text-gray-800 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-300',
  };

  const severityTextColors = {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-red-600 dark:text-red-400',
    error: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <motion.div
      className={`p-5 border-l-4 ${severityStyles[severity]} rounded-lg shadow-md mb-4 flex flex-col`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.01, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
    >
      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <p className={`text-sm font-semibold mb-2 ${severityTextColors[severity]}`}>Severity: {severity.toUpperCase()}</p>
      <div className="flex-grow">
        <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
          <span className="font-medium">Description:</span> {description}
        </p>
        <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
          <span className="font-medium">Recommendation:</span> {recommendation}
        </p>
      </div>
      {fix && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-2 text-blue-600 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Show fix for ${name}`}
        >
          Show Fix
        </button>
      )}
      <FixModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} fix={fix || ''} language={fixLanguage || 'javascript'} />
    </motion.div>
  );
};

export default memo(ResultCard);