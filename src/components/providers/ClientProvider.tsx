'use client';

import { Theme } from "@/components/providers/ThemeProvider";
import Header from "@/components/Header";
import QueryProvider from "@/components/providers/QueryProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast"
export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme>
      <SessionProvider>
        <QueryProvider>
          <Header />
          <Toaster />
          <main className="container py-8">{children}</main>
        </QueryProvider>
      </SessionProvider>
    </Theme>
  );
}
