"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/ui/button";

export default function WalletConnect() {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (address) {
    return (
      <Button onClick={() => disconnect()}>
        Disconnect ({ address.slice(0, 6)}...{address.slice(-4)})
      </Button>
    );
  }
  
  return (
    <Button onClick={() => connect({ connector: connectors[0] })}>
      Connect Wallet
    </Button>
  );
}