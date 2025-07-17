import type { Chain } from "viem";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

export const umiDevnet: Chain = {
  id: 42069,
  name: "Umi Devnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://devnet.uminetwork.com"] },
    public:  { http: ["https://devnet.uminetwork.com"] },
  },
  blockExplorers: {
    default: {
      name: "Umi Devnet Explorer",
      url: "https://devnet.explorer.umi.network",
    },
  },
  testnet: true,
} as const;

export const wagmiConfig = createConfig({
  chains: [umiDevnet],
  transports: { [umiDevnet.id]: http('https://devnet.uminetwork.com') },
  connectors: [injected()],
});