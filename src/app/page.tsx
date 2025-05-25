"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    backgroundColor: "#2563eb",
    transition: { type: "spring", stiffness: 300 },
  },
};

export default function Home() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4"
    >
      <motion.h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
        Welcome to APIRequester Pro
      </motion.h1>

      <motion.p className="mb-8 text-lg text-gray-300 max-w-md text-center">
        A powerful, fast, and elegant tool for testing and managing APIs effortlessly.
      </motion.p>

      <motion.div variants={buttonVariants} whileHover="hover">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition duration-300 ease-in-out"
        >
          Get Started
        </Link>
      </motion.div>
    </motion.div>
  );
}
