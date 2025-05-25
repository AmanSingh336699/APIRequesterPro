"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/validators/auth.schema";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { motion } from "framer-motion";
import {z} from "zod"

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (!res?.ok) {
      alert("Invalid credentials");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="card">
        <h2 className="text-2xl mb-4">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
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
          <Button type="submit" className="w-full">{!isSubmitting ? "Login" : "Login..."}</Button>
        </form>
      </div>
    </motion.div>
  );
}