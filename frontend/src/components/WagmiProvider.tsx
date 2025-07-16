"use client";

import type { ReactNode } from "react";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

interface WagmiProviderProps {
  children: ReactNode;
}

