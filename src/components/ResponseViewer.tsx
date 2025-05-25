import { motion } from "framer-motion";

interface ResponseViewerProps {
  response: {
    success?: boolean | string;
    data?: any;
    error?: string;
    status?: number;
    code?: number;
    time: number;
    headers?: Record<string, string>;
  };
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const isResponseOk = () => {
    const statusRaw = response.status ?? response.code;
    if (typeof statusRaw === "number") {
      return statusRaw >= 200 && statusRaw < 300;
    }
    if (typeof statusRaw === "string") {
      const lower = (statusRaw as string).toLowerCase();
      if (lower === "success" || lower === "ok") {
        return true;
      }
      const parsed = parseInt(lower, 10);
      if (!isNaN(parsed)) {
        return parsed >= 200 && parsed < 300;
      }
    }
    if (typeof response.success === "boolean") {
      return response.success;
    }
    return false;
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-6 p-5 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700"
    >
      <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Request Result</h4>

      {isResponseOk() ? (
        <>
          <p className="text-gray-700 dark:text-gray-300 mb-1">
            <span className="font-medium">Status:</span>{" "}
            <span className={`font-bold ${(response.status ?? response.code) && (response.status ?? response.code)! >= 200 && (response.status ?? response.code)! < 300
              ? "text-green-600"
              : "text-red-600"
              }`}>
              {response.status ?? response.code ?? 'N/A'}
            </span>
          </p>

          <p className="text-gray-700 dark:text-gray-300 mb-3">
            <span className="font-medium">Time:</span>{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">{response.time}ms</span>
          </p>

          {response.data && (
            <>
              <h5 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-100">Response Body:</h5>
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-60 border border-gray-300 dark:border-gray-600">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </>
          )}

          {response.headers && Object.keys(response.headers).length > 0 && (
            <>
              <h5 className="text-md font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-100">Response Headers:</h5>
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-40 border border-gray-300 dark:border-gray-600">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </>
          )}
        </>
      ) : (
        <p className="text-red-600 dark:text-red-400 font-medium">Error: {response.error || "Unknown Error"}</p>
      )}
    </motion.div>
  );
}
