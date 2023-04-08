import { EntryPoint__factory } from "@account-abstraction/contracts";
import { ethers } from "ethers";
import { useAccount, useNetwork, useSigner } from "wagmi";

import OTPFactory from "../../../contracts/artifacts/contracts/OTPFactory.sol/OTPFactory.json";
import { OTP__factory } from "../../../contracts/typechain-types/factories/contracts/OTP.sol/OTP__factory";

const ENTRYPOINT_ADDR = "0xB890B15AF9bF4edcE2d39D5Ef321D33d876f8378";

const address = {
  OTPFactory: "0x8bE7560eEb4fF64aB2914ffa573A38f003d9E739",
  Verifier: "0xAA8De56927542E7Af85AE3F68Fb69594E7cF8613",
};

export const useContract = () => {
  const { data: signer } = useSigner();
  const { address: accountAddress } = useAccount();
  const network = useNetwork();

  const connectOTP = async (otpAddress: string) => {
    if (!signer) throw new Error("Signer not available");
    const otp = OTP__factory.connect(otpAddress, signer);
    return otp;
  };

  const deployOTP = async (root: string) => {
    if (!signer) throw new Error("Signer not available");

    const provider = signer.provider;
    if (!provider) throw new Error("Provider not available");

    const factory = new ethers.Contract(address.OTPFactory, OTPFactory.abi, signer);
    const Tx = await factory.createOTP(address.Verifier, root);
    const tx = await Tx.wait();
    const deployedAddress = tx.events[0].args.newAddress;
    localStorage.setItem("OTPaddress", deployedAddress);
    return deployedAddress;
  };

  const getEntryPoint = () => {
    if (!signer) throw new Error("Signer not available");
    return EntryPoint__factory.connect(ENTRYPOINT_ADDR, signer);
  };

  return { connectOTP, deployOTP, getEntryPoint, signer, accountAddress, network };
};
