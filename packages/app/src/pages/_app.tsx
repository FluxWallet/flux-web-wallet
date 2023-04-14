import "@rainbow-me/rainbowkit/styles.css";
import "@fontsource/inter/variable.css";
import "./globals.css";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useNetwork,WagmiConfig } from "wagmi";

import { useIsMounted } from "@/hooks/useIsMounted";
import { myRainbowKitTheme } from "@/lib/theme";
import { chains, wagmiClient } from "@/lib/wallet";

const NetworkReloadWatcher = () => {
  const { chain } = useNetwork();
  const [currentChainId, setCurrentChainId] = useState<number>();

  useEffect(() => {
    if (chain?.id) {
      if (currentChainId && currentChainId !== chain.id) {
        window.location.reload();
      }
      setCurrentChainId(chain.id);
    }
  }, [chain?.id, currentChainId]);

  return null;
};

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { isMounted } = useIsMounted();

  if (!isMounted) return null;

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} showRecentTransactions theme={myRainbowKitTheme}>
        <NetworkReloadWatcher />
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default MyApp;
