import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AceEditor from 'react-ace';
import ace from 'ace-builds';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-monokai';

interface FixModalProps {
  isOpen: boolean;
  onClose: () => void;
  fix: string;
  language?: string;
}

const FixModal: React.FC<FixModalProps> = ({ isOpen, onClose, fix, language = 'javascript' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ace.config.set('basePath', '/ace-builds-cdn');
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 pointer-events-none backdrop-blur-sm"
      style={{ WebkitBackdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fix-modal-title"
    >
      <motion.div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-auto max-h-[90vh] overflow-auto shadow-xl border border-gray-200 dark:border-gray-700 pointer-events-auto"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="fix-modal-title" className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Recommended Fix
        </h2>
        <AceEditor
          mode={language}
          theme="monokai"
          value={fix}
          readOnly
          width="100%"
          height="200px"
          setOptions={{ useWorker: false }}
          aria-label="Code fix suggestion"
          className="border border-gray-300 dark:border-gray-600 rounded-md"
        />
        <button
          onClick={onClose}
          className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 dark:bg-blue-700 dark:hover:bg-blue-800"
          aria-label="Close fix modal"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );

  return ReactDOM.createPortal(
    <AnimatePresence>{isOpen && modalContent}</AnimatePresence>,
    document.getElementById("modal-root")!
  );
};

export default FixModal;
