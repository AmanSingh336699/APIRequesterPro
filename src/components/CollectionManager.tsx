"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { makeRequest } from "@/lib/axios";
import { containerVariants, itemVariants } from "./CollectionRunner";

const collectionSchema = z.object({
    name: z.string().min(1, "Collection name is required").trim(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function CollectionsManager() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data: collections, isLoading: collectionsLoading, error: collectionsError } = useQuery({
        queryKey: ["collections"],
        queryFn: async () => {
            const res = await makeRequest({
                method: "GET",
                url: "/collections"
            })
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: CollectionFormData) => {
            const res = await makeRequest({
                method: "POST",
                url: "/collections",
                data
            })
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
            reset();
            setError(null);
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || "Failed to create collection");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            setDeletingId(id);
            await makeRequest({
                method: "DELETE",
                url: `/collections/${id}`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["collections"] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.error || "Failed to delete collection");
        },
        onSettled: () => {
            setDeletingId(null);
        }
    });


    const { register, handleSubmit, formState: { errors }, reset } = useForm<CollectionFormData>({
        resolver: zodResolver(collectionSchema),
    });

    const onSubmit = (data: CollectionFormData) => {
        createMutation.mutate(data);
    };

    if (collectionsLoading) {
        return (
            <motion.div
                className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl flex items-center justify-center min-h-[200px] text-gray-700 dark:text-gray-300"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading collections...
            </motion.div>
        );
    }

    if (collectionsError) {
        return (
            <motion.div
                className="p-6 bg-red-100 dark:bg-red-800 shadow-lg rounded-xl text-red-700 dark:text-red-200"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <p>Error loading collections: {collectionsError.message}</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 font-inter"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Manage Collections</h3>

            <motion.form onSubmit={handleSubmit(onSubmit)} className="mb-6" variants={itemVariants}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow">
                        <input
                            {...register("name")}
                            type="text"
                            placeholder="Enter collection name"
                            className={`w-full p-3 border rounded-lg shadow-sm
                          bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                          focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out
                          ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                        )}
                    </div>
                    <motion.button
                        type="submit"
                        disabled={createMutation.isPending}
                        className={`px-6 py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-300 ease-in-out
                        ${createMutation.isPending
                                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 active:scale-95"
                            }`}
                        whileHover={{ scale: createMutation.isPending ? 1 : 1.02 }}
                        whileTap={{ scale: createMutation.isPending ? 1 : 0.98 }}
                    >
                        {createMutation.isPending ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </span>
                        ) : (
                            "Create Collection"
                        )}
                    </motion.button>
                </div>
                {error && <p className="text-red-500 dark:text-red-400 mt-3 text-center sm:text-left">{error}</p>}
            </motion.form>

            {collections?.length === 0 ? (
                <motion.p
                    className="text-center text-gray-600 dark:text-gray-400 py-4"
                    variants={itemVariants}
                >
                    No collections found. Create one to start saving requests!
                </motion.p>
            ) : (
                <motion.ul className="space-y-3" variants={itemVariants}>
                    <AnimatePresence>
                        {collections?.map((col: any) => (
                            <motion.li
                                key={col._id}
                                className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2 sm:mb-0">
                                    {col.name}
                                </span>
                                <motion.button
                                    onClick={() => deleteMutation.mutate(col._id)}
                                    disabled={deletingId === col._id}
                                    className={`px-4 py-2 rounded-lg text-white font-semibold shadow-md transition-all duration-300 ease-in-out
                              ${deletingId === col._id
                                            ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                                            : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 active:scale-95"
                                        }`}
                                    whileHover={{ scale: deletingId === col._id ? 1 : 1.02 }}
                                    whileTap={{ scale: deletingId === col._id ? 1 : 0.98 }}
                                >
                                    {deletingId === col._id ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deleting...
                                        </span>
                                    ) : (
                                        "Delete"
                                    )}
                                </motion.button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </motion.ul>
            )}
        </motion.div>
    );
}
