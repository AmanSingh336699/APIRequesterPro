'use client';

import { Theme } from "@/components/providers/ThemeProvider";
import Header from "@/components/Header";
import QueryProvider from "@/components/providers/QueryProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

function AppProviders({ children }: { children: React.ReactNode }) {
  const { session } = useAuth(); 
  return (
    <>
      {session?.user && <Header />}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <main className="container py-8">{children}</main>
    </>
  );
}

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme>
      <SessionProvider>
        <QueryProvider>
          <AppProviders>{children}</AppProviders>
        </QueryProvider>
      </SessionProvider>
    </Theme>
  );
}
