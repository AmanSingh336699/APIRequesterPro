"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import RequestRunner from "@/components/RequestRunner";
import Button from "@/components/ui/Button";
import { MenuIcon } from "lucide-react";

const sidebarVariants = {
  hidden: { x: -300 },
  visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: -300, transition: { duration: 0.2 } },
};

export default function DashboardClient() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-800">
      <AnimatePresence>
        {(isSidebarOpen || !isMobile) && (
          <motion.aside
            key="sidebar"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sidebarVariants}
            className="fixed md:static top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-zinc-700"
          >
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        {isMobile && !isSidebarOpen && (
          <Button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <MenuIcon className="h-4 w-4" />
            Menu
          </Button>
        )}

        {isSidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 px-2 sm:px-4 md:px-6 lg:px-10 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-white dark:bg-zinc-800 rounded-xl p-4 sm:p-6 shadow-lg"
          >
            <Suspense fallback={<div className="text-gray-500 dark:text-gray-400">Loading...</div>}>
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <RequestRunner />
              </motion.div>
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
