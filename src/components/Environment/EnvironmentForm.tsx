"use client"
import { useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { EnvironmentFormData, Variable } from "@/types/index";
import Input from "../ui/Input"
import Button from "../ui/Button";
import { envSchema } from "@/validators/env.schema";

interface EnvironmentFormProps {
    onSubmit: (data: EnvironmentFormData) => void;
    isPending: boolean;
    error: string | null;
    newEnvVariables: Variable[];
    setNewEnvVariables: (vars: Variable[]) => void;
    newVariable: Variable;
    setNewVariable: (variable: Variable) => void;
}

const EnvironmentForm = ({
    onSubmit,
    isPending,
    error,
    newEnvVariables,
    setNewEnvVariables,
    newVariable,
    setNewVariable,
}: EnvironmentFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EnvironmentFormData>({
        resolver: zodResolver(envSchema),
        defaultValues: { name: "", variables: [] },
    });

    const hasDuplicateKey = useCallback(
        (variables: Variable[], newKey: string) => variables.some((v) => v.key === newKey),
        []
    );

    const addVariable = () => {
        if (!newVariable.key) return;
        if (hasDuplicateKey(newEnvVariables, newVariable.key)) {
            toast.error(`Variable key "${newVariable.key}" already exists.`);
            return;
        }
        setNewEnvVariables([...newEnvVariables, { ...newVariable }]);
        setNewVariable({ key: "", value: "" });
    };

    const removeVariable = (index: number) => {
        setNewEnvVariables(newEnvVariables.filter((_, i) => i !== index));
    };

    const handleFormSubmit = (data: EnvironmentFormData) => {
        onSubmit({
            ...data,
            variables: newEnvVariables,
        });
    };

    return (
        <motion.form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="mb-8 space-y-6 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Environment Name
                </label>
                <Input
                    {...register("name")}
                    placeholder="e.g., Production"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    error={errors.name?.message}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variables
                </label>
                <AnimatePresence>
                    {newEnvVariables.map((variable, index) => (
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
                                    setNewEnvVariables(
                                        newEnvVariables.map((v, i) => (i === index ? { ...v, key: e.target.value } : v))
                                    )
                                }
                                placeholder="Key (e.g., base_url)"
                                className="w-full sm:flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                            <Input
                                value={variable.value}
                                onChange={(e) =>
                                    setNewEnvVariables(
                                        newEnvVariables.map((v, i) => (i === index ? { ...v, value: e.target.value } : v))
                                    )
                                }
                                placeholder="Value (e.g., https://api.example.com)"
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
            <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-6 rounded-md transition-all duration-200 disabled:opacity-50"
            >
                {isPending ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Creating...
                    </span>
                ) : (
                    <span className="flex items-center">
                        <Plus size={20} className="mr-2" />
                        Create Environment
                    </span>
                )}
            </Button>
            {error && (
                <p className="flex items-center text-red-500 dark:text-red-400 mt-2">
                    <AlertCircle size={20} className="mr-2" />
                    {error}
                </p>
            )}
        </motion.form>
    );
};

export default memo(EnvironmentForm)