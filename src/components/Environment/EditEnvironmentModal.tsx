"use client"
import { useState, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Save } from "lucide-react";
import { EnvironmentFormData, Environment, Variable } from "@/types/index";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { envSchema } from "@/validators/env.schema";

interface EditEnvironmentModalProps {
  env: Environment;
  onClose: () => void;
  onUpdate: (data: EnvironmentFormData) => void;
  isPending: boolean;
}

const EditEnvironmentModal = ({ env, onClose, onUpdate, isPending }: EditEnvironmentModalProps) => {
  const [variables, setVariables] = useState<Variable[]>(env.variables);
  const [newVariable, setNewVariable] = useState<Variable>({ key: "", value: "" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnvironmentFormData>({
    resolver: zodResolver(envSchema),
    defaultValues: { name: env.name, variables: env.variables },
  });

  const hasDuplicateKey = useCallback(
    (variables: Variable[], newKey: string) => variables.some((v) => v.key === newKey),
    []
  );

  const addVariable = () => {
    if (!newVariable.key) return;
    if (hasDuplicateKey(variables, newVariable.key)) {
      toast.error(`Variable key "${newVariable.key}" already exists.`);
      return;
    }
    setVariables([...variables, { ...newVariable }]);
    setNewVariable({ key: "", value: "" });
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const onSubmit = (data: EnvironmentFormData) => {
    onUpdate({ ...data, variables });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Environment: {env.name}
          </h3>
          <Button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white p-2 rounded-md"
            aria-label="Close modal"
          >
            <X size={24} />
          </Button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Environment Name
            </label>
            <Input
              {...register("name")}
              placeholder="Environment Name"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              error={errors.name?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variables
            </label>
            <AnimatePresence>
              {variables.map((variable, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    value={variable.key}
                    onChange={(e) =>
                      setVariables(variables.map((v, i) => (i === index ? { ...v, key: e.target.value } : v)))
                    }
                    placeholder="Key"
                    className="w-full sm:flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <Input
                    value={variable.value}
                    onChange={(e) =>
                      setVariables(variables.map((v, i) => (i === index ? { ...v, value: e.target.value } : v)))
                    }
                    placeholder="Value"
                    className="w-full sm:flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <Button
                    onClick={() => removeVariable(index)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition-colors duration-200"
                    aria-label="Remove variable"
                  >
                    <Trash2 size={20} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Input
                value={newVariable.key}
                onChange={(e) => setNewVariable({ ...newVariable, key: e.target.value })}
                placeholder="New Key"
                className="w-full sm:flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <Input
                value={newVariable.value}
                onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                placeholder="New Value"
                className="w-full sm:flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <Button
                type="button"
                onClick={addVariable}
                disabled={!newVariable.key}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors duration-200 disabled:opacity-50"
                aria-label="Add variable"
              >
                <Plus size={20} />
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save size={20} className="mr-2" />
                  Update
                </span>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default memo(EditEnvironmentModal)