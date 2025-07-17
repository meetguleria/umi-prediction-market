import type { Chain } from "viem";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const rpcUrl  = process.env.NEXT_PUBLIC_RPC_URL as string;

export const activeChain: Chain = {
  id: chainId,
  name: `Chain ${chainId}`,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  testnet: process.env.NODE_ENV !== "production",
} as const;

export const wagmiConfig = createConfig({
  chains: [activeChain],
  transports: { [activeChain.id]: http(rpcUrl) },
  connectors: [injected()],
});