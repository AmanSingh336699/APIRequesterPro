"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

type Props = {
  children: ReactNode;
  dehydratedState?: unknown;
};

export default function QueryProvider({ children, dehydratedState }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  );
}
