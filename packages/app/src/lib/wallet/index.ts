import { connectorsForWallets, wallet } from "@rainbow-me/rainbowkit";
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { Chain, chain, configureChains, createClient } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";

const localhostChain: Chain = {
  ...chain.localhost,
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
};

const { chains, provider } = configureChains(
  [localhostChain, chain.sepolia, chain.goerli],
  [
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID }),
    publicProvider(),
  ]
);

export interface RainbowWeb3AuthConnectorProps {
  chains: Chain[];
}

export const rainbowWeb3AuthConnector = ({ chains }: RainbowWeb3AuthConnectorProps) => {
  return {
    id: "web3auth",
    name: "Web3Auth",
    iconUrl: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
    iconBackground: "#fff",
    createConnector: () => {
      const connector = new Web3AuthConnector({
        chains,
        options: {
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID as string,
          network: "testnet",
          chainId: "0x" + (chains[0]?.id || 5).toString(16),
          socialLoginConfig: {
            mfaLevel: "default",
          },
        },
      });
      return {
        connector,
      };
    },
  };
};

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      rainbowWeb3AuthConnector({ chains: [chain.sepolia, chain.goerli] }),
      wallet.walletConnect({ chains }),
      wallet.metaMask({ chains }),
      wallet.rainbow({ chains }),
    ],
  },
]);

export { chains };

export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});
