"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/validators/auth.schema";
import { makeRequest } from "@/lib/axios";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { motion } from "framer-motion";
import { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await makeRequest({
        method: "POST",
        url: "/auth/register",
        data,
      });
      router.push("/login");
    } catch (error: any) {
      alert(error.message || "Registration failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="card">
        <h2 className="text-2xl mb-4">Register</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Name"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="Email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Button type="submit" className="w-full">{!isSubmitting ? "Register" : "Register..."}</Button>
        </form>
      </div>
    </motion.div>
  );
}