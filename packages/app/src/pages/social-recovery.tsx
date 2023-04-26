import { ConnectButton } from "@rainbow-me/rainbowkit";
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
        {fluxWalletAddress ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-8 px-6 pb-6">
              <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Let&apos;s Setup</h1>
              <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">This Can Save You From Disaster :)</h2>
            </div>
            <Card>
              <div className="space-y-4 text-gray-700">
                {txError && <p className="text-red-500 text-xs text-center font-medium">{txError}</p>}
                <div>
                  <h2 className="font-bold text-xs text-gray-900 font-sans mb-1">Your Flux Wallet Address</h2>
                  <p className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-2 font-mono break-all text-gray-800">{fluxWalletAddress}</p>
                </div>
                <div>
                  <form className="space-y-3">
                    <div>
                      <label htmlFor="guardian" className="block mb-1 text-xs font-bold text-gray-900 font-sans">Guardian #1</label>
                      <input type="text" value={guardian} onChange={(e) => setGuardian(e.target.value)} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="Wallet Address" required />
                    </div>
                    <div>
                      <label htmlFor="guardian2" className="block mb-1 text-xs font-bold text-gray-900 font-sans">Guardian #2</label>
                      <input type="text" value={guardian2} onChange={(e) => setGuardian2(e.target.value)} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="Wallet Address" required />
                    </div>
                  </form>
                  
                  <div className="pt-4">
                    <button
                      onClick={txSetGuardians}
                      disabled={!guardian || !guardian2 || txLoading}
                      className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {txLoading ? "Processing..." : "Set Your Social Recovery"}
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 mt-4">
                    <p className="text-[11px] font-sans font-bold text-gray-900">Recovery URL to share</p>
                    <button className="text-[9px] text-indigo-600 font-medium break-all hover:underline text-left w-full mt-0.5" onClick={onClickLink}>
                      {`${origin}/recovery?address=${fluxWalletAddress}`}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-8 px-6 pb-6">
              <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Social Recovery</h1>
              <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">Setup account backup guardians</h2>
            </div>

            <Card>
              <div className="space-y-6 text-center text-gray-700 py-6 my-auto">
                <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse"></div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 p-[2px] shadow-lg shadow-emerald-500/10 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-emerald-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Connect Owner Wallet</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                    Connect your owner EOA wallet to configure trusted guardians for your smart contract wallet.
                  </p>
                </div>

                <div className="pt-4">
                  <ConnectButton.Custom>
                    {({ account, chain, openConnectModal, openChainModal, mounted }) => {
                      const ready = mounted;
                      if (!ready) return null;

                      const isConnected = !!account && !!chain;
                      const isSupported = isConnected && (chain.id === 11155111 || chain.id === 5 || chain.id === 1337 || chain.id === 31337);

                      if (!isConnected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="w-full py-3.5 rounded-xl text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/25 bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-xl hover:shadow-emerald-600/35 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (!isSupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="w-full py-3.5 rounded-xl text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-rose-600/25 bg-gradient-to-r from-rose-600 to-red-600 hover:shadow-xl hover:shadow-rose-600/35 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                          >
                            Switch to Sepolia
                          </button>
                        );
                      }

                      return null;
                    }}
                  </ConnectButton.Custom>
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
