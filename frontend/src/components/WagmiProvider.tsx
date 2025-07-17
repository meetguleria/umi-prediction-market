"use client";
import type { ReactNode } from "react";
import { WagmiProvider as WagmiRootProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Single QueryClient instance for the entire React tree
const queryClient = new QueryClient();

interface WagmiProviderProps {
  children: ReactNode;
}

export default function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <WagmiRootProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiRootProvider>
  );
}
