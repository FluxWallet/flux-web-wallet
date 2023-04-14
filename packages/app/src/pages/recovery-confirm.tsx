import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { Card } from "@/components/shared/Card";

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
        {socialRecoveryWalletAddress ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-6 px-5 pb-6">
              <h1 className="text-4xl text-white py-2 font-extrabold tracking-tight font-sans">Start Recovery</h1>
              <h2 className="text-sm text-gray-300 font-medium font-sans">Finalize smart wallet ownership recovery</h2>
            </div>
            <Card>
              <div className="space-y-3.5 text-gray-700">
                {txError && <p className="text-red-500 text-xs text-center font-medium">{txError}</p>}
                
                {!address && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-medium leading-relaxed">
                    ⚠️ Please connect your guardian wallet in the top-right to execute recovery.
                  </div>
                )}

                <div>
                  <h2 className="font-bold text-xs text-gray-900 font-sans mb-0.5">Old Wallet Address</h2>
                  <p className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-2 font-mono break-all text-gray-800">{socialRecoveryWalletAddress}</p>
                </div>

                <div className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl p-2 px-3">
                  <div>
                    <h2 className="font-bold text-xs text-gray-900 font-sans">Guardian Status</h2>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOk ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"}`}>
                    {isOk.toString()}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl p-2 px-3">
                  <div>
                    <h2 className="font-bold text-xs text-gray-900 font-sans">Recovery Status</h2>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inRecovery ? "bg-indigo-100 text-indigo-800" : "bg-gray-200 text-gray-700"}`}>
                    {inRecovery.toString()}
                  </span>
                </div>

                <div>
                  <form className="space-y-2.5">
                    <div>
                      <label className="block mb-1 text-xs font-bold text-gray-900 font-sans">New Owner Address</label>
                      <input type="text" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="Wallet Address" required />
                    </div>
                    <div>
                      <label htmlFor="guardian" className="block mb-1 text-xs font-bold text-gray-900 font-sans">Guardian #1</label>
                      <input type="text" value={guardian} onChange={(e) => setGuardian(e.target.value)} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="Wallet Address" required />
                    </div>
                    <div>
                      <label htmlFor="guardian2" className="block mb-1 text-xs font-bold text-gray-900 font-sans">Guardian #2</label>
                      <input type="text" value={guardian2} onChange={(e) => setGuardian2(e.target.value)} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="Wallet Address" required />
                    </div>
                  </form>
                </div>

                <div className="pt-2">
                  <button
                    onClick={txRecovery} disabled={!newOwner || !isOk || !inRecovery || !guardian || !guardian2 || txLoading}
                    className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {txLoading ? "Processing..." : "Start Recovery"}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-6 px-5 pb-6">
              <h1 className="text-4xl text-white py-2 font-extrabold tracking-tight font-sans">Recovery Confirm</h1>
              <h2 className="text-sm text-gray-300 font-medium font-sans">Execute wallet key recovery</h2>
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
