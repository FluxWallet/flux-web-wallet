import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";

import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

export const accounts = process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
    gnosis: {
      url: "https://rpc.gnosischain.com",
      accounts,
      allowUnlimitedContractSize: true,
    },
    chiado: {
      url: "https://rpc.chiadochain.net",
      gasPrice: 1000000000,
      accounts,
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_GOERLI_KEY ?? ""}`,
      accounts,
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_SEPOLIA_KEY ?? ""}`,
      accounts,
      allowUnlimitedContractSize: true,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_KEY ?? ""}`,
      accounts,
      allowUnlimitedContractSize: true,
    },
    scroll: {
      url: "https://alpha-rpc.scroll.io/l2",
      chainId: 534353,
      accounts,
    },
    optimism_goerli: {
      chainId: 420,
      url: `https://opt-goerli.g.alchemy.com/v2/${process.env.L2_ALCHEMY_KEY}`,
      accounts,
    },
    optimism_mainnet: {
      chainId: 10,
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.L2_ALCHEMY_KEY}`,
      accounts,
    },
    zkEVM: {
      url: `https://rpc.public.zkevm-test.net`,
      chainId: 1442,
      accounts,
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  }
};

export default config;
