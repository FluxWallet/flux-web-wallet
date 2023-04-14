import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { Card } from "@/components/shared/Card";

import { FluxWallet__factory } from "../../../contracts/typechain-types";

const HomePage: NextPage = () => {
  const router = useRouter();

  const [fluxWalletAddress, setFluxWalletAddress] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const { data: signer } = useSigner();
  const { address } = useAccount();

  const [isOk, setIsOk] = useState(false);
  const [inRecovery, setInRecovery] = useState(false);

  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txError, setTxError] = useState("");

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const txInit = async () => {
    if (!signer || !address) return;
    setTxLoading("init");
    setTxError("");
    try {
      const contract = FluxWallet__factory.connect(fluxWalletAddress, signer);
      await contract.initiateRecovery(newOwner);
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : String(err));
    } finally {
      setTxLoading(null);
    }
  };

  const txSupport = async () => {
    if (!signer || !address) return;
    setTxLoading("support");
    setTxError("");
    try {
      const contract = FluxWallet__factory.connect(fluxWalletAddress, signer);
      await contract.supportRecovery(newOwner);
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : String(err));
    } finally {
      setTxLoading(null);
    }
  };

  const txCancel = async () => {
    if (!signer || !address) return;
    setTxLoading("cancel");
    setTxError("");
    try {
      const contract = FluxWallet__factory.connect(fluxWalletAddress, signer);
      await contract.cancelRecovery();
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : String(err));
    } finally {
      setTxLoading(null);
    }
  };

  useEffect(() => {
    setFluxWalletAddress(router.query.address as string);
  }, [router]);

  useEffect(() => {
    if (!signer || !address || !fluxWalletAddress) return;
    const contract = FluxWallet__factory.connect(fluxWalletAddress, signer);
    contract.isGuardian(address).then((isOk) => setIsOk(isOk));
    contract.inRecovery().then((inRecovery) => setInRecovery(inRecovery));
  }, [signer, address, fluxWalletAddress]);

  const onClickLink = () => {
    router.push(`${origin}/recovery-confirm?address=${fluxWalletAddress}`);
  };

  return (
    <DefaultLayout>
      <div className="appbox">
        {fluxWalletAddress ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-6 px-5 pb-6">
              <h1 className="text-4xl text-white py-2 font-extrabold tracking-tight font-sans">Recover Wallet</h1>
              <h2 className="text-sm text-gray-300 font-medium font-sans">Approve or trigger owner key recovery</h2>
            </div>
            <Card>
              <div className="space-y-3.5 text-gray-700">
                {txError && <p className="text-red-500 text-xs text-center font-medium">{txError}</p>}
                
                {!address && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-medium leading-relaxed">
                    ⚠️ Please connect your guardian wallet in the top-right to authorize recovery transactions.
                  </div>
                )}

                <div>
                  <h2 className="font-bold text-xs text-gray-900 font-sans mb-0.5">Target Wallet Address</h2>
                  <p className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-2 font-mono break-all text-gray-800">{fluxWalletAddress}</p>
                </div>

                <div className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl p-2.5 px-3">
                  <div>
                    <h2 className="font-bold text-xs text-gray-900 font-sans">Guardian Status</h2>
                    <p className="text-[9px] text-gray-400">Connected account is guardian</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOk ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"}`}>
                    {isOk.toString()}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl p-2.5 px-3">
                  <div>
                    <h2 className="font-bold text-xs text-gray-900 font-sans">Recovery Status</h2>
                    <p className="text-[9px] text-gray-400">Recovery is active</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inRecovery ? "bg-indigo-100 text-indigo-800" : "bg-gray-200 text-gray-700"}`}>
                    {inRecovery.toString()}
                  </span>
                </div>

                <div>
                  <form className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-900 font-sans">New Owner Address</label>
                    <input type="text" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="New Owner Address" required />
                    <p className="text-[9px] text-gray-400 font-sans">* Input new owner and initiate/support recovery</p>
                  </form>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={txInit} disabled={!newOwner || !isOk || inRecovery || txLoading !== null}
                    className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {txLoading === "init" ? "Processing..." : "Init"}
                  </button>
                  <button
                    onClick={txSupport} disabled={!newOwner || !isOk || !inRecovery || txLoading !== null}
                    className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {txLoading === "support" ? "Processing..." : "Support"}
                  </button>
                  <button
                    onClick={txCancel} disabled={!inRecovery || txLoading !== null}
                    className="w-full py-3 rounded-full bg-black text-white hover:bg-gray-900 font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {txLoading === "cancel" ? "Processing..." : "Cancel"}
                  </button>
                  
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <button className="text-[9px] text-indigo-600 font-medium break-all hover:underline text-left w-full mt-0.5" onClick={onClickLink}>
                      Go to Confirmation Page
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-6 px-5 pb-6">
              <h1 className="text-4xl text-white py-2 font-extrabold tracking-tight font-sans">Recovery</h1>
              <h2 className="text-sm text-gray-300 font-medium font-sans">Social recovery controls</h2>
            </div>

            <Card>
              <div className="space-y-6 text-center text-gray-700 py-6">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 font-sans">Invalid Recovery Link</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[240px] mx-auto">
                    No target smart contract wallet address was specified for recovery. Please verify the link shared by the wallet owner.
                  </p>
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
