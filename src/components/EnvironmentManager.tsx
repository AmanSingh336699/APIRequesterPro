"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import EnvironmentForm from "./Environment/EnvironmentForm";
import { useEnvStore } from "@/stores/envStore";
import toast from "react-hot-toast";
import EnvironmentList from "./Environment/EnvironmentList";
import { motion, AnimatePresence } from "framer-motion";
import EditEnvironmentModal from "./Environment/EditEnvironmentModal";

const variableSchema = z.object({
    key: z.string().min(1, "Key is required").trim(),
    value: z.string().trim(),
});

const environmentSchema = z.object({
    name: z.string().min(1, "Environment name is required").trim(),
    variables: z.array(variableSchema).optional(),
});

type EnvironmentFormData = z.infer<typeof environmentSchema>;

interface Variable {
    key: string;
    value: string;
}

interface Environment {
    _id: string;
    name: string;
    variables: Variable[];
}

export default function EnvironmentManager() {
    const queryClient = useQueryClient();
    const { environments, setEnvironments, setSelectedEnvironment, selectedEnvironment } = useEnvStore();
    const [error, setError] = useState<string | null>(null);
    const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
    const [newEnvVariables, setNewEnvVariables] = useState<Variable[]>([]);
    const [newVariable, setNewVariable] = useState<Variable>({ key: "", value: "" });

    const { data: fetchedEnvironments, isLoading } = useQuery({
        queryKey: ["environments"],
        queryFn: async () => {
            const res = await axios.get("/api/environments", { withCredentials: true });
            return res.data;
        },
    });

    useEffect(() => {
        if (Array.isArray(fetchedEnvironments)) {
            setEnvironments(fetchedEnvironments);
        } else if (
            fetchedEnvironments &&
            typeof fetchedEnvironments === "object" &&
            "environments" in fetchedEnvironments &&
            Array.isArray((fetchedEnvironments as { environments: unknown }).environments)
        ) {
            setEnvironments((fetchedEnvironments as { environments: Environment[] }).environments);
        }
    }, [fetchedEnvironments, setEnvironments]);

    const createMutation = useMutation({
        mutationFn: async (data: EnvironmentFormData) => {
            const res = await axios.post("/api/environments", data, { withCredentials: true });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["environments"] });
            setNewEnvVariables([]);
            setError(null);
            toast.success("Environment created successfully!");
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || "Failed to create environment");
            toast.error(error.response?.data?.error || "Failed to create environment");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name: string; variables: Variable[] } }) => {
            const res = await axios.put(`/api/environments/${id}`, data, { withCredentials: true });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["environments"] });
            setEditingEnv(null);
            setNewVariable({ key: "", value: "" });
            setError(null);
            toast.success("Environment updated successfully!");
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || "Failed to update environment");
            toast.error(error.response?.data?.error || "Failed to update environment");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/environments/${id}`, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["environments"] });
            const currentSelectedEnv = environments.find((e) => e.name === selectedEnvironment);
            if (currentSelectedEnv && editingEnv?._id === currentSelectedEnv._id) {
                setSelectedEnvironment(environments[0]?.name || null);
            }
            setEditingEnv(null);
            toast.success("Environment deleted successfully!");
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || "Failed to delete environment");
            toast.error(error.response?.data?.error || "Failed to delete environment");
        },
    });

    const handleCreateSubmit = (data: EnvironmentFormData) => {
        createMutation.mutate({ ...data, variables: newEnvVariables });
    };

    const handleUpdateSubmit = (data: EnvironmentFormData) => {
        if (!editingEnv) return;
        updateMutation.mutate({
            id: editingEnv._id,
            data: { name: data.name, variables: data.variables ?? [] },
        });
    };

    if (isLoading) {
        return (
            <div className="p-6 text-gray-700 dark:text-gray-300 flex items-center justify-center min-h-[200px]">
                <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Loading environments...
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-4xl mx-auto">
            <motion.h3
                className="text-3xl font-bold mb-8 text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Environment Manager
            </motion.h3>
            <EnvironmentForm
                onSubmit={handleCreateSubmit}
                isPending={createMutation.isPending}
                error={error}
                newEnvVariables={newEnvVariables}
                setNewEnvVariables={setNewEnvVariables}
                newVariable={newVariable}
                setNewVariable={setNewVariable}
            />
            <EnvironmentList
                environments={environments}
                selectedEnvironment={selectedEnvironment}
                setSelectedEnvironment={setSelectedEnvironment}
                onEdit={setEditingEnv}
                onDelete={deleteMutation.mutate}
                isDeleting={deleteMutation.isPending}
            />
            <AnimatePresence>
                {editingEnv && (
                    <EditEnvironmentModal
                        env={editingEnv}
                        onClose={() => setEditingEnv(null)}
                        onUpdate={handleUpdateSubmit}
                        isPending={updateMutation.isPending}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}