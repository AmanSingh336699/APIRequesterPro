"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import Button from "./ui/Button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { session } = useAuth()

  return (
    <motion.header
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      className="bg-white dark:bg-gray-800 shadow"
    >
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="APIRequester Pro" width={32} height={32} />
          <Link href="/" className="text-xl font-bold">APIRequester Pro</Link>
        </div>
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/profile" className="hover:underline">Profile</Link>
              <Button variant="secondary" onClick={() => signOut()}>Sign Out</Button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Login</Link>
              <Link href="/register" className="hover:underline">Register</Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}