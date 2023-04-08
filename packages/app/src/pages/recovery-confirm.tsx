/* eslint-disable camelcase */
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";

import { FluxWallet__factory } from "../../../contracts/typechain-types";

const HomePage: NextPage = () => {
  const router = useRouter();

  const [socialRecoveryWalletAddress, setFluxWalletAddress] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const [guardian, setGuardian] = useState("");
  const [guardian2, setGuardian2] = useState("");
  const [isOk, setIsOk] = useState(false);
  const [inRecovery, setInRecovery] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  const txRecovery = async () => {
    if (!signer || !address) return;
    setTxLoading(true);
    setTxError("");
    try {
      const contract = FluxWallet__factory.connect(socialRecoveryWalletAddress, signer);
      await contract.executeRecovery(newOwner, [guardian, guardian2]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTxError(message);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    setFluxWalletAddress(router.query.address as string);
  }, [router]);

  useEffect(() => {
    if (!signer || !address || !socialRecoveryWalletAddress) return;
    const contract = FluxWallet__factory.connect(socialRecoveryWalletAddress, signer);
    contract.isGuardian(address).then((isOk) => setIsOk(isOk));
    contract.inRecovery().then((inRecovery) => setInRecovery(inRecovery));
  }, [signer, address, socialRecoveryWalletAddress]);

  return (
    <DefaultLayout>
      <div className="appbox">
        <div>
          <div className="pt-4 px-4">
            <h1 className="text-4xl text-white py-4 font-sans">Start Flux Wallet Recovery</h1>
            <h2 className="text-base text-white py-2 pb-10 font-sans"></h2>
          </div>
          <div className="bg-white rounded-[16px] object-contain w-[320px] h-[480px] relative">
            <div className="flex h-full items-center justify-center px-4 inset-x-0 bottom-0">
              <div className="w-full">
                {txError && <p className="text-red-500 text-sm px-2">{txError}</p>}
                <div>
                  <div className="py-1">
                    <h2 className="font-bold font-sans">Old Wallet Address </h2>
                    <p className="text-[11px]">{socialRecoveryWalletAddress}</p>
                  </div>
                  <div className="flex py-1">
                    <h2 className="font-bold font-sans"> Guardian Status : </h2>
                    <p className="pt-1 text-[13px]"> {isOk.toString()}</p>
                  </div>
                  <div className="flex py-1 pb-3">
                    <h2 className="font-bold font-sans"> Recovery Status : </h2>
                    <p className="pt-1 text-[13px]">{inRecovery.toString()}</p>
                  </div>

                  <div>
                    <form>
                      <div className="py-2">
                        <label className="block mb-2 font-bold font-sans text-gray-900 dark:text-white">New Owner Address</label>
                        <input type="text" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Wallet Address" required />
                      </div>
                      <div>
                        <label htmlFor="guardian" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Guardian #1</label>
                        <input type="text" value={guardian} onChange={(e) => setGuardian(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Wallet Address" required />
                      </div>
                      <div className="py-2">
                        <label htmlFor="guardian2" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Guardian #2</label>
                        <input type="text" value={guardian2} onChange={(e) => setGuardian2(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Wallet Address" required />
                      </div>
                    </form>
                  </div>
                  <div>
                    <button
                      onClick={txRecovery} disabled={!newOwner || !isOk || !inRecovery || !guardian || !guardian2 || txLoading}
                      className="w-[280px] my-1 relative inline-flex items-center justify-center p-4 px-5 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out rounded-full shadow-xl group hover:ring-1 hover:ring-purple-500"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-700"></span>
                      <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                      <span className="relative text-white">{txLoading ? "Processing..." : "Start Recovery"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default HomePage;
