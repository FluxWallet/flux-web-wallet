import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { DefaultLayout } from "@/components/layouts/Default";
import { Card } from "@/components/shared/Card";
import { useFluxWallet } from "@/hooks/useFluxWallet";

const HomePage: NextPage = () => {
  const router = useRouter();
  const { fluxWalletAddress, contract } = useFluxWallet();
  const [guardian, setGuardian] = useState("");
  const [guardian2, setGuardian2] = useState("");

  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const txSetGuardians = async () => {
    if (!contract) {
      setTxError("Contract not available. Please connect your wallet.");
      return;
    }
    setTxLoading(true);
    setTxError("");
    try {
      await contract.setGuardians([guardian, guardian2], 2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTxError(message);
    } finally {
      setTxLoading(false);
    }
  };

  const onClickLink = () => {
    router.push(`${origin}/recovery?address=${fluxWalletAddress}`);
  };

  return (
    <DefaultLayout>
      <div className="appbox">
        {fluxWalletAddress && (
          <div>
            <div className="pt-4 px-4">
              <h1 className="text-4xl text-white py-4 font-sans">Let&apos;s Setup</h1>
              <h2 className="text-base text-white py-2 pb-10 font-sans"> This Can Save You From  Disaster :) </h2>
            </div>
            <Card>
              {txError && <p className="text-red-500 text-sm px-2">{txError}</p>}
              <div>
                <div className="py-4">
                  <h2 className="font-bold font-sans">Your Flux Wallet Address </h2>
                  <p className="text-[11px]">{fluxWalletAddress}</p>
                </div>
                <div>
                  <form>
                    <div>
                      <label htmlFor="guardian" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Guardian #1</label>
                      <input type="text" value={guardian} onChange={(e) => setGuardian(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Wallet Address" required />
                    </div>
                    <div className="py-4">
                      <label htmlFor="guardian2" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Guardian #2</label>
                      <input type="text" value={guardian2} onChange={(e) => setGuardian2(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Wallet Address" required />
                    </div>
                  </form>
                  <button
                    onClick={txSetGuardians} disabled={!guardian || !guardian2 || txLoading}
                    className="w-[280px] my-1 relative inline-flex items-center justify-center p-4 px-5 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out rounded-full shadow-xl group hover:ring-1 hover:ring-purple-500"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-700"></span>
                    <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                    <span className="relative text-white">{txLoading ? "Processing..." : "Set Your Social Recovery"}</span>
                  </button>
                  <p className="text-[12px] font-sans font-bold pt-4">Recovery URL to share</p>
                  <button className="text-[8px] font-sans p-0" onClick={onClickLink}>
                    {`${origin}/recovery?address=${fluxWalletAddress}`}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default HomePage;
