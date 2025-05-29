"use client";

import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "@/lib/axios";
import { useRequestStore } from "@/stores/requestStore";
import { useEnvStore } from "@/stores/envStore";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Loader2,
  TriangleAlert,
  FolderDot
} from "lucide-react";
import toast from "react-hot-toast";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const { setRequest } = useRequestStore();
  const { selectedEnvironment, setSelectedEnvironment, environments, setEnvironments } = useEnvStore();
  const [isMdUp, setIsMdUp] = useState(false);
  const [openCollection, setOpenCollection] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMdUp(window.innerWidth >= 768);
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  const { data: fetchedEnvironments, isLoading: envLoading, isError: envError, error: envErrorObj } = useQuery({
    queryKey: ["environments"],
    queryFn: async () => {
      const res = await makeRequest({ method: "GET", url: "/environments" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });


  useEffect(() => {
    if (fetchedEnvironments) {
      setEnvironments(fetchedEnvironments);
    }
  }, [fetchedEnvironments, setEnvironments]);

  const { data: collections, isLoading: colLoading, isError: colError, error: colErrorObj } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      try {
        const res = await makeRequest({ method: "GET", url: "/collections" });
        return res.data;
      } catch (error: any) {
        toast.error(`Failed to load collections: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleRequestClick = async (collectionId: string, requestId: string) => {
    try {
      const res = await makeRequest({ method: "GET", url: `/collections/${collectionId}/requests` });
      const request = res.data.find((r: any) => r._id === requestId);
      if (request) {
        setRequest(request);
        toast.success(`Loaded request: ${request.name}`);
        if (!isMdUp) toggleSidebar();
      } else {
        toast.error("Request not found in collection.");
      }
    } catch (error: any) {
      toast.error(`Failed to load request: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleCollection = (collectionId: string) => {
    setOpenCollection(openCollection === collectionId ? null : collectionId);
  };

  if (envLoading || colLoading) {
    return (
      <div className="p-4 text-gray-700 dark:text-gray-300 flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-3" />
        <p className="text-lg font-medium">Loading data...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fetching environments and collections.</p>
      </div>
    );
  }

  if (envError || colError) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400 flex flex-col items-center justify-center h-full text-center">
        <TriangleAlert className="h-10 w-10 mb-4" />
        <p className="font-bold text-xl mb-2">Error!</p>
        <p className="text-sm">
          {envError ? envErrorObj?.message : colErrorObj?.message || "An unexpected error occurred."}
        </p>
        <p className="text-xs mt-2">Please try refreshing the page or check your network connection.</p>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="p-4 text-gray-600 dark:text-gray-400 flex flex-col items-center justify-center h-full">
        <FolderDot className="h-12 w-12 mb-4 text-blue-500" />
        <p className="text-xl font-semibold mb-2">No Collections Found</p>
        <p className="text-sm text-center max-w-xs">
          <p className="text-sm text-center max-w-xs">
            It looks like you haven&apos;t created any collections yet. Let&apos;s get started!
          </p>
        </p>
        <Button
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 flex items-center group"
          onClick={() => {
            toast("Feature to create a new collection coming soon!");
          }}
        >
          <Plus className="inline-block mr-2 group-hover:rotate-90 transition-transform duration-300" size={20} /> New Collection
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: isMdUp || isOpen ? 0 : -300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed md:static top-0 left-0 w-72 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-5 h-screen overflow-y-auto z-50 md:z-0
      shadow-xl md:shadow-none custom-scrollbar border-r border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-center mb-8">
        <Button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          aria-label="Close Sidebar"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="mb-7 p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md border border-gray-100 dark:border-gray-600">
        <label htmlFor="environment-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Select Environment
        </label>
        {environments.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm italic">No environments defined.</div>
        ) : (
          <select
            id="environment-select"
            value={selectedEnvironment ?? ""}
            onChange={(e) => setSelectedEnvironment(e.target.value || null)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base appearance-none bg-no-repeat bg-right-1rem pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundSize: '1.2em', backgroundPosition: 'calc(100% - 12px) center', backgroundRepeat: 'no-repeat' }}
          >
            <option value="">No Environment Selected</option>
            {environments.map((env) => (
              <option key={env.name} value={env.name}>
                {env.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-4">
        {collections.map((col: any) => (
          <div key={col._id} className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-600 group">
            <Button
              className="w-full flex justify-between items-center p-4 text-left font-bold text-lg text-gray-900 dark:text-white
                bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200 rounded-t-xl
                group-hover:text-blue-600 dark:group-hover:text-blue-300"
              onClick={() => toggleCollection(col._id)}
            >
              <div className="flex items-center">
                <FolderDot size={20} className="mr-3 text-blue-500 dark:text-blue-300" />
                <span>{col.name}</span>
              </div>
              {openCollection === col._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
            <AnimatePresence>
              {openCollection === col._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="pt-2 pb-3 px-4 border-t border-gray-200 dark:border-gray-600"
                >
                  {col.requests && col.requests.length > 0 ? (
                    <div className="space-y-2">
                      {col.requests.map((req: any) => (
                        <Button
                          key={req._id}
                          variant="secondary"
                          className="w-full text-left py-2.5 px-3 text-gray-800 dark:text-gray-200
                            bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/50
                            hover:text-blue-700 dark:hover:text-blue-300
                            font-medium rounded-lg transition-all duration-200 flex items-center justify-between group"
                          onClick={() => handleRequestClick(col._id, req._id)}
                        >
                          <span className="truncate">{req.name}</span>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-md
                            ${req.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              req.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                req.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                  req.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                            {req.method}
                          </span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">No requests in this collection.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default Sidebar;