import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    umi: {
      url: process.env.UMI_RPC_URL,
      chainId: 42069,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

export default config;
