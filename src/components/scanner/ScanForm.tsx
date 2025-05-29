'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { scanInputSchema } from '@/validators/scan.schema';
import { makeRequest } from '@/lib/axios';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Globe, Send, AlertCircle } from 'lucide-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import { validateJSON } from '@/utils/helper';

type FormData = z.infer<typeof scanInputSchema>;

export default function ScanForm() {
    const router = useRouter();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [headerErrors, setHeaderErrors] = useState<{ row: number; column: number; text: string; type: string; }[]>([]);
    const [bodyErrors, setBodyErrors] = useState<{ row: number; column: number; text: string; type: string; }[]>([]);
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(scanInputSchema),
        defaultValues: {
            url: '',
            headers: '',
            body: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        setSubmitError(null);
        if (headerErrors.length || bodyErrors.length) {
            toast.error('Please fix JSON syntax errors before submitting.');
            return;
        }
        try {
            const response = await makeRequest({
                method: 'POST',
                url: 'requests/scan',
                data: data,
            });

            const { scanId } = response.data;
            toast.success('Scan started successfully!');
            router.push(`/scan/${scanId}/result`);
            reset();
        } catch (err: any) {
            const message = err?.message || 'Something went wrong';
            toast.error(message);
            setSubmitError(message);
            console.error('Submission error:', err);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-xl p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-6"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            role="form"
            aria-label="API scan form"
        >
            <h2 className="text-4xl font-extrabold text-center text-gray-900 dark:text-gray-50 mb-6 flex items-center justify-center gap-3">
                <Send className="w-8 h-8 text-blue-600" /> API Security Scanner
            </h2>

            {submitError && (
                <motion.div
                    className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <AlertCircle className="w-5 h-5" />
                    <p>{submitError}</p>
                </motion.div>
            )}

            <div className="relative">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API URL
                    <span className="ml-1 text-sm text-gray-500" title="Enter a valid HTTPS URL (e.g., https://api.example.com)">[?]</span>
                </label>
                <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                    <input
                        id="url"
                        {...register('url')}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${errors.url ? 'border-red-500 ring-red-500' : 'border-gray-300'
                            }`}
                        placeholder="https://api.example.com/data"
                    />
                </div>
                {errors.url && (
                    <motion.p
                        className="text-red-500 text-xs mt-1 flex items-center gap-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <AlertCircle size={14} /> {errors.url.message}
                    </motion.p>
                )}
            </div>

            <div className="relative">
                <label htmlFor="headers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Headers (JSON, optional)
                    <span className="ml-1 text-sm text-gray-500" title="Optional JSON headers for authentication (e.g., {'Authorization': 'Bearer token'})">[?]</span>
                </label>
                <Controller
                    name="headers"
                    control={control}
                    render={({ field }) => (
                        <AceEditor
                            mode="json"
                            theme="monokai"
                            name="headers"
                            onChange={(value) => {
                                field.onChange(value);
                                setHeaderErrors(validateJSON(value));
                            }}
                            value={field.value}
                            width="100%"
                            height="100px"
                            setOptions={{ useWorker: false }}
                            annotations={headerErrors}
                            aria-describedby="headers-error"
                            placeholder='{"Authorization": "Bearer token"}'
                        />
                    )}
                />
                {errors.headers && (
                    <motion.p
                        className="text-red-500 text-xs mt-1 flex items-center gap-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <AlertCircle size={14} /> {errors.headers.message}
                    </motion.p>
                )}
            </div>

            <div className="relative">
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Body (JSON)
                    <span className="ml-1 text-sm text-gray-500" title="Optional JSON body for POST/PUT requests (e.g., {'key': 'value'})">[?]</span>
                </label>
                <Controller
                    name="body"
                    control={control}
                    render={({ field }) => (
                        <AceEditor
                            mode="json"
                            theme="monokai"
                            name="body"
                            onChange={(value) => {
                                field.onChange(value);
                                setBodyErrors(validateJSON(value));
                            }}
                            value={field.value}
                            width="100%"
                            height="100px"
                            setOptions={{ useWorker: false }}
                            annotations={bodyErrors}
                            aria-describedby="body-error"
                            placeholder='{"key": "value"}'
                        />
                    )}
                />
                {errors.body && (
                    <motion.p
                        className="text-red-500 text-xs mt-1 flex items-center gap-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <AlertCircle size={14} /> {errors.body.message}
                    </motion.p>
                )}
            </div>
            <div className="mb-4">
                <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-blue-600 hover:underline text-sm"
                    aria-expanded={showHelp}
                    aria-controls="help-section"
                >
                    {showHelp ? 'Hide Help' : 'Show Help'}
                </button>
                {showHelp && (
                    <div id="help-section" className="mt-2 p-4 bg-gray-100 rounded-md text-sm text-gray-700">
                        <p><strong>Headers Example:</strong> <code>{'{"Authorization": "Bearer <token>", "Content-Type": "application/json"}'}</code></p>
                        <p className="mt-2"><strong>Body Example:</strong> <code>{'{"query": "search", "page": 1}'}</code></p>
                        <p className="mt-2">Headers are required for authenticated APIs. Body is required for POST or PUT requests.</p>
                    </div>
                )}
            </div>

            <motion.button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out flex items-center justify-center gap-2
          ${isSubmitting
                        ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                        : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 shadow-md hover:shadow-lg'
                    }
        `}
                aria-label="Start API scan"
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
                {isSubmitting ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Scanning...
                    </>
                ) : (
                    <>
                        <Send size={20} /> Start Scan
                    </>
                )}
            </motion.button>
        </motion.form>
    );
}