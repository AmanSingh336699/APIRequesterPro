"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import Button from "./ui/Button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode, MouseEventHandler } from "react";

export default function Header() {
  const { session } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white dark:bg-gray-900 shadow-lg fixed w-full z-50 top-0 left-0"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Image
            src="/logo.svg"
            alt="APIRequester Pro"
            width={36}
            height={36}
            className="w-9 h-9"
          />
          <Link
            href="/"
            className={`text-2xl font-extrabold transition-colors duration-300 ${pathname === "/"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
          >
            APIRequester Pro
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {session ? (
            <>
              <NavLink href="/scan" active={pathname === "/scan"}>
                Scan
              </NavLink>
              <NavLink href="/scan/history" active={pathname === "/scan/history"}>
                Scanner History
              </NavLink>
              <NavLink href="/dashboard" active={pathname === "/dashboard"}>
                Dashboard
              </NavLink>
              <NavLink href="/profile" active={pathname === "/profile"}>
                Profile
              </NavLink>
              <Button
                variant="secondary"
                onClick={() => signOut()}
                className="px-5 py-2 text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <NavLink href="/login" active={pathname === "/login"}>
                Login
              </NavLink>
              <Link href="/register" passHref>
                <Button className="px-5 py-2 text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  Register
                </Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>

        <div className="md:hidden flex items-center space-x-3">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-7 w-7" />
            ) : (
              <Menu className="h-7 w-7" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={menuVariants}
          className="md:hidden bg-white dark:bg-gray-800 shadow-md pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 absolute w-full"
        >
          <nav className="flex flex-col items-center space-y-4 px-4">
            {session ? (
              <>
                <MobileNavLink href="/scan" onClick={() => setIsMobileMenuOpen(false)} active={pathname === "/scan"}>
                  Scan
                </MobileNavLink>
                <MobileNavLink href="/scan/history" onClick={() => setIsMobileMenuOpen(false)} active={pathname === "/scan/history"}>
                  Scanner History
                </MobileNavLink>
                <MobileNavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} active={pathname === "/dashboard"}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink href="/profile" onClick={() => setIsMobileMenuOpen(false)} active={pathname === "/profile"}>
                  Profile
                </MobileNavLink>
                <Button
                  variant="secondary"
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full max-w-xs px-5 py-3 text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <MobileNavLink href="/login" onClick={() => setIsMobileMenuOpen(false)} active={pathname === "/login"}>
                  Login
                </MobileNavLink>
                <Link href="/register" passHref>
                  <Button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full max-w-xs px-5 py-3 text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}

type NavLinkProps = {
  href: string;
  children: ReactNode;
  active?: boolean;
};

function NavLink({ href, children, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`text-base font-medium transition-colors duration-300 relative group ${active
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
        }`}
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );
}

type MobileNavLinkProps = {
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
  active?: boolean;
};

function MobileNavLink({ href, onClick, children, active }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block w-full text-center font-medium text-lg py-3 rounded-lg transition-all duration-300 ${active
          ? "text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-gray-700"
          : "text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
    >
      {children}
    </Link>
  );
}
