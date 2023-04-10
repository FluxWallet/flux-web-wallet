/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable */

// import Create2Factory from "./artifacts/contracts/Create2Factory.json";
// import {
//   AbiCoder,
//   hexConcat,
//   hexlify,
//   hexValue,
//   hexZeroPad,
// } from "ethers/lib/utils";

import {
  EntryPoint,
  EntryPoint__factory,
} from "@account-abstraction/contracts";
import { ERC4337EthersProvider } from "@account-abstraction/sdk";
import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { ethers, providers } from "ethers";
import { useAccount, useNetwork, useSigner } from "wagmi";

import OTP from "../../contracts/artifacts/contracts/OTP.sol/OTP.json";
import OTPFactory from "../../contracts/artifacts/contracts/OTPFactory.sol/OTPFactory.json";
import { generateCalldata } from "./circuit_js/generate_calldata";
import { useFluxWallet } from "./hooks/useFluxWallet";
import { FluxWallet__factory } from "../../contracts/typechain-types/factories/contracts/FluxWallet.sol/FluxWallet__factory";
// import { deployments } from 'hardhat';
import { FluxWalletDeployer__factory } from "../../contracts/typechain-types/factories/contracts/FluxWalletDeployer__factory";
import { OTP__factory } from "../../contracts/typechain-types/factories/contracts/OTP.sol/OTP__factory";
// import { FluxPaymasterApi } from "./typechain-types/FluxPaymasterApi";
// import { FluxWalletApi } from "./typechain-types/FluxWalletApi";

const address = {
  OTPFactory: "0x8bE7560eEb4fF64aB2914ffa573A38f003d9E739",
  Verifier: "0xAA8De56927542E7Af85AE3F68Fb69594E7cF8613",
};


let factory;
let otp;


const ENTRYPOINT_ADDR = "0xB890B15AF9bF4edcE2d39D5Ef321D33d876f8378";
// const MY_WALLET_DEPLOYER = address.FluxWalletDeployer;

const providerConfig = {
  entryPointAddress: ENTRYPOINT_ADDR,
  bundlerUrl: "https://eip4337-bundler-goerli.protonapp.io/rpc",
};

export async function connectContract(_addr) {
  throw new Error("contract.js is dead code — hooks cannot be called outside React components");
}

export async function setRootAndVerifier(
  _smartWalletAPI,
  _aaProvier
) {
  throw new Error("contract.js is dead code — references undefined variables");
}

export async function getAaParams() {
  throw new Error("contract.js is dead code — hooks cannot be called outside React components");
}

// for otp factory
export async function connectFactory() {
  const { ethereum } = window;

  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  console.log("signer: ", await signer.getAddress());

  factory = new ethers.Contract(address.OTPFactory, OTPFactory.abi, signer);

  console.log("Connect to OTPFactory Contract:", OTPFactory);
}

export async function deployOTP(root) {
  await connectFactory();

  const Tx = await factory.createOTP(address.Verifier, root);
  const tx = await Tx.wait();
  console.log(tx);
  const deployedAddress = tx.events[0].args.newAddress;

  localStorage.setItem("OTPaddress", deployedAddress);

  return deployedAddress;
}

export async function naiveProof(
  _input,
  _amount,
  _recepient
) {
  throw new Error("contract.js is dead code — references undefined variables");
}

export async function blockTimestampProof(input) {
  if (localStorage.getItem("OTPaddress")) {
    console.log(localStorage.getItem("OTPaddress"));
    await connectContract(localStorage.getItem("OTPaddress"));
  } else {
    throw new Error("No OTP contract address found. Deploy first.");
  }

  const calldata = await generateCalldata(input);
  let tx;

  if (calldata) {
    tx = await otp
      .blockApproval(calldata[0], calldata[1], calldata[2], calldata[3])
      .catch((error) => {
        console.log(error);
        let errorMsg;
        if (error.reason) {
          errorMsg = error.reason;
        } else if (error.data.message) {
          errorMsg = error.data.message;
        } else {
          errorMsg = "Unknown error.";
        }
        throw errorMsg;
      });
  } else {
    throw new Error("Witness generation failed.");
  }
  return tx;
}
