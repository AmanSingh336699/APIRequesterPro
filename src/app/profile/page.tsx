"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { makeRequest } from "@/lib/axios";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await makeRequest({
            method: "GET",
            url: "/user/profile",
        });
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
        await makeRequest({
            method: "PUT",
            url: "/user/profile",
            data,
        })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
  });

  const onSubmit = (data: UpdateProfileForm) => {
    mutation.mutate(data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 shadow rounded">
      <h2 className="text-2xl mb-4">Profile</h2>
      <p><strong>Name:</strong> {user?.name}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
        <div className="mb-4">
          <label className="block mb-1">New Name</label>
          <input
            {...register("name")}
            className="w-full p-2 border rounded"
          />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full p-2 border rounded"
          />
          {errors.password && <p className="text-red-500">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
}