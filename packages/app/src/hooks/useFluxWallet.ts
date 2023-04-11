/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */

import { EntryPoint, EntryPoint__factory } from "@account-abstraction/contracts";
import { useEffect, useState } from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";

import deploymentsConfig from "@/config/deployments.json";
import type { Deployments } from "@/types";

import { FluxWalletAPI } from "../../../contracts/lib/FluxWalletAPI";
import { FluxWallet, FluxWallet__factory } from "../../../contracts/typechain-types";

export const useFluxWallet = () => {
  const { data: signer } = useSigner();
  const { isConnected, address } = useAccount();
  const connectedNetwork = useNetwork();

  const [fluxWalletAPI, setFluxWalletAPI] = useState<FluxWalletAPI>();
  const [fluxWalletAddress, setFluxWalletAddress] = useState("");
  const [isDeployed, setIsDeployed] = useState(false);
  const [entryPoint, setEntryPoint] = useState<EntryPoint>();
  const [contract, setContract] = useState<FluxWallet>();
  const [ownerWallet, setOwnerWallet] = useState("");
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (!signer || !isConnected) {
      setFluxWalletAPI(undefined);
      setFluxWalletAddress("");
      return;
    }

    window.localStorage.setItem("debug", "aa*");

    const networkName = connectedNetwork.chain?.network ?? "goerli";
    if (networkName !== "localhost" && networkName !== "goerli") {
      alert("please connect goerli network!");
      return;
    }

    const dep = (deploymentsConfig as Record<string, Deployments | undefined>)[networkName];
    if (!dep) {
      console.error(`No deployment config for ${networkName}`);
      return;
    }
    if (!dep.entryPoint) {
      console.error(`EntryPoint address not configured for ${networkName}`);
      return;
    }

    const api = new FluxWalletAPI({
      provider: signer.provider!,
      entryPointAddress: dep.entryPoint,
      owner: signer,
      factoryAddress: dep.factory,
    });
    setFluxWalletAPI(api);
    setEntryPoint(EntryPoint__factory.connect(dep.entryPoint, signer));

    const cachedAddress = window.localStorage.getItem(`${address}:${networkName}`);

    if (cachedAddress) {
      setFluxWalletAddress(cachedAddress);
      signer.provider!.getCode(cachedAddress).then((code) => setIsDeployed(code !== "0x"));
      const c = FluxWallet__factory.connect(cachedAddress, signer);
      setContract(c);
      signer?.getAddress().then((result) => setOwnerWallet(result));
      signer.provider?.getBalance(cachedAddress).then((bal) => setBalance(bal.toString()));
    } else {
      api.getWalletAddress().then((addr) => {
        window.localStorage.setItem(`${address}:${networkName}`, addr);
        setFluxWalletAddress(addr);
        signer.provider!.getCode(addr).then((code) => setIsDeployed(code !== "0x"));
        const c = FluxWallet__factory.connect(addr, signer);
        setContract(c);
        signer.provider?.getBalance(addr).then((bal) => setBalance(bal.toString()));
      });
    }
  }, [signer, connectedNetwork.chain?.network, isConnected, address]);

  return { entryPoint, fluxWalletAPI, fluxWalletAddress, isDeployed, contract, balance, ownerWallet };
};
