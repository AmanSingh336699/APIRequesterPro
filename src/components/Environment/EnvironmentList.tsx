"use client"
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit } from "lucide-react";
import { Environment } from "@/types/index";
import Button from "../ui/Button";
import { memo } from "react";

interface EnvironmentListProps {
  environments: Environment[];
  selectedEnvironment: string | null;
  setSelectedEnvironment: (env: string | null) => void;
  onEdit: (env: Environment) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const EnvironmentList = ({
  environments,
  selectedEnvironment,
  setSelectedEnvironment,
  onEdit,
  onDelete,
  isDeleting,
}: EnvironmentListProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Environment
        </label>
        <select
          value={selectedEnvironment || ""}
          onChange={(e) => setSelectedEnvironment(e.target.value || null)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        >
          <option value="">No Environment</option>
          {environments.map((env) => (
            <option key={env._id} value={env.name}>
              {env.name}
            </option>
          ))}
        </select>
      </div>
      {environments.length === 0 ? (
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          No environments found. Create one to start using variables!
        </motion.p>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence>
            {environments.map((env) => (
              <motion.li
                key={env._id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span className="text-gray-900 dark:text-white font-medium">{env.name}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(env)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition-colors duration-200"
                      aria-label={`Edit ${env.name}`}
                    >
                      <Edit size={20} />
                    </Button>
                    <Button
                      onClick={() => onDelete(env._id)}
                      disabled={isDeleting}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition-colors duration-200 disabled:opacity-50"
                      aria-label={`Delete ${env.name}`}
                    >
                      {isDeleting ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

export default memo(EnvironmentList)