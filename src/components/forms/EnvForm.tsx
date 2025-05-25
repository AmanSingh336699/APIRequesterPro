// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useEnvStore } from "@/stores/envStore";
// import { envSchema } from "@/validators/env.schema";
// import { z } from "zod";
// import { motion, AnimatePresence } from "framer-motion";
// import Button from "../ui/Button";
// import Input from "../ui/Input";
// import { toast } from "react-hot-toast";
// import { X } from "lucide-react";
// import { useEffect, useState, useTransition, useRef } from "react";

// const fadeIn = {
//   hidden: { opacity: 0, y: 10 },
//   show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
// };

// const dropdownAnim = {
//   hidden: { opacity: 0, scaleY: 0.95 },
//   show: { opacity: 1, scaleY: 1, transition: { duration: 0.25 } },
// };

// const sectionFade = {
//   hidden: { opacity: 0, x: -10 },
//   show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
// };

// type EnvFormData = z.infer<typeof envSchema>;

// export default function EnvForm() {
//   const { environments, addEnvironment, setSelectedEnvironment } = useEnvStore();
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isDirty },
//     getValues,
//     setValue,
//     reset,
//   } = useForm<EnvFormData>({
//     resolver: zodResolver(envSchema),
//     defaultValues: { name: "", variables: [{ key: "", value: "" }] },
//   });

//   const [selected, setSelected] = useState("");
//   const [isPending, startTransition] = useTransition();
//   const isSwitchingRef = useRef(false);

//   const confirmUnsavedChanges = () => {
//     return !isDirty || window.confirm("You have unsaved changes. Do you want to continue?");
//   };

//   useEffect(() => {
//     if (!isSwitchingRef.current) return;
//     const env = environments.find((e) => e.name === selected);
//     if (env) {
//       reset({ name: env.name, variables: env.variables });
//     }
//     isSwitchingRef.current = false;
//   }, [selected, environments, reset]);

//   const onSubmit = (data: EnvFormData) => {
//     startTransition(() => {
//       try {
//         addEnvironment(data.name, data.variables);
//         setSelectedEnvironment(data.name);
//         toast.success("Environment saved successfully");
//       } catch (err) {
//         toast.error("Failed to save environment");
//       }
//     });
//   };

//   const removeVariable = (indexToRemove: number) => {
//     const current = getValues("variables") || [];
//     const updated = current.filter((_, idx) => idx !== indexToRemove);
//     setValue("variables", updated);
//   };

//   const handleReset = () => {
//     if (!confirmUnsavedChanges()) return;
//     reset({ name: "", variables: [{ key: "", value: "" }] });
//     setSelected("");
//   };

//   const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     if (!confirmUnsavedChanges()) return;
//     isSwitchingRef.current = true;
//     const value = e.target.value;
//     setSelected(value);
//     setSelectedEnvironment(value);
//   };

//   return (
//     <motion.div
//       initial="hidden"
//       animate="show"
//       variants={fadeIn}
//       className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md w-full max-w-xl mx-auto"
//     >
//       <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
//         Manage Environments
//       </h3>
//       <AnimatePresence mode="wait">
//         <motion.form
//           key={selected}
//           initial="hidden"
//           animate="show"
//           exit="hidden"
//           variants={sectionFade}
//           onSubmit={handleSubmit(
//             onSubmit,
//             () => toast.error("Please fix form errors before submitting.")
//           )}
//           className="space-y-4"
//         >
//           <Input
//             label="Environment Name"
//             {...register("name")}
//             error={errors.name?.message}
//           />
//           <div>
//             <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Variables</label>
//             <AnimatePresence>
//               {getValues("variables").map((_, index) => (
//                 <motion.div
//                   key={index}
//                   initial="hidden"
//                   animate="show"
//                   exit="hidden"
//                   variants={fadeIn}
//                   className="flex space-x-3 mt-2 items-center"
//                 >
//                   <Input
//                     {...register(`variables.${index}.key`)}
//                     placeholder="Key"
//                     error={errors.variables?.[index]?.key?.message}
//                   />
//                   <Input
//                     {...register(`variables.${index}.value`)}
//                     placeholder="Value"
//                     error={errors.variables?.[index]?.value?.message}
//                   />
//                   <motion.button
//                     type="button"
//                     whileTap={{ scale: 0.9 }}
//                     whileHover={{ scale: 1.1 }}
//                     onClick={() => removeVariable(index)}
//                     className="text-red-500 hover:text-red-700"
//                   >
//                     <X className="w-5 h-5" />
//                   </motion.button>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//             <div className="mt-3">
//               <motion.div
//                 whileTap={{ scale: 0.97 }}
//                 whileHover={{ scale: 1.02 }}
//               >
//                 <Button
//                   type="button"
//                   variant="secondary"
//                   onClick={() => {
//                     const current = getValues("variables") || [];
//                     setValue("variables", [...current, { key: "", value: "" }]);
//                   }}
//                   className="w-full"
//                 >
//                   + Add Variable
//                 </Button>
//               </motion.div>
//             </div>
//           </div>
//           <div className="flex gap-3">
//             <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} className="w-full">
//               <Button type="submit" className="w-full" disabled={isPending}>
//                 {isPending ? "Saving..." : "Save Environment"}
//               </Button>
//             </motion.div>
//             <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
//               <Button type="button" variant="secondary" onClick={handleReset}>
//                 Clear
//               </Button>
//             </motion.div>
//           </div>
//         </motion.form>
//       </AnimatePresence>
//       <div className="mt-6">
//         <h4 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">Environments</h4>
//         <AnimatePresence mode="wait">
//           <motion.select
//             key={selected}
//             onChange={handleSelectChange}
//             initial="hidden"
//             animate="show"
//             exit="hidden"
//             variants={dropdownAnim}
//             className="w-full p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
//           >
//             {environments.map((env) => (
//               <option key={env.name} value={env.name}>
//                 {env.name}
//               </option>
//             ))}
//           </motion.select>
//         </AnimatePresence>
//       </div>
//     </motion.div>
//   );
// }