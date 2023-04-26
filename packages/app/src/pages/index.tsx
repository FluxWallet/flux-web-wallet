import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SafeOnRampEvent, SafeOnRampKit, SafeOnRampProviderType } from '@safe-global/onramp-kit';
import { ethers } from "ethers";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useAccount, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { Card } from "@/components/shared/Card";
import { useFluxWallet } from "@/hooks/useFluxWallet";

import { NULL_ADDRESS, NULL_BYTES } from "../../../contracts/lib/utils";
import { FluxWallet__factory } from "../../../contracts/typechain-types";

const HomePage: NextPage = () => {
  const { fluxWalletAddress, entryPoint, fluxWalletAPI, isDeployed, balance } = useFluxWallet();

  const router = useRouter();

  const { data: signer } = useSigner();
  const { address } = useAccount();

  const [owner, setOwner] = useState("");
  const [onRampClient, setOnRampClient] = useState<SafeOnRampKit>()
  const stripeRootRef = useRef<HTMLDivElement>(null)

  const handleCreateSession = async () => {
    if (stripeRootRef.current) {
      stripeRootRef.current.innerHTML = ''
    }

    onRampClient?.open({
      sessionId: "",
      walletAddress: fluxWalletAddress,
      networks: ['ethereum', 'polygon'],
      element: '#stripe-root',
      events: {
        onLoaded: () => console.log('onLoaded()'),
        onPaymentSuccessful: (eventData: SafeOnRampEvent) =>
          console.log('onPaymentSuccessful(): ', eventData),
        onPaymentProcessing: (eventData: SafeOnRampEvent) =>
          console.log('onPaymentProcessing(): ', eventData),
        onPaymentError: (eventData: SafeOnRampEvent) => console.log('onPaymentError(): ', eventData)
      }
    })
  }

  const deploy = async () => {
    if (!fluxWalletAPI || !entryPoint || !signer || !address) return;
    await signer.sendTransaction({
      to: fluxWalletAddress,
      value: ethers.utils.parseEther("0.01"),
    });
  };

  const deploy2 = async () => {
    if (!fluxWalletAPI || !entryPoint || !signer || !address) return;
    const op = await fluxWalletAPI.createSignedUserOp({
      target: NULL_ADDRESS,
      data: NULL_BYTES,
    });
    await entryPoint.handleOps([op], address);
  };

  const deploy3 = async (event: React.MouseEvent) => {
    event.preventDefault();
    router.push("/auth");
  }

  useEffect(() => {
    if (!signer || !address || !fluxWalletAddress) return;

    if (isDeployed) {
      const contract = FluxWallet__factory.connect(fluxWalletAddress, signer);
      contract.owner().then((owner) => setOwner(owner));
    } else {
      setOwner(address);
    }

    (async () => {
      const onRampClient = await SafeOnRampKit.init(SafeOnRampProviderType.Stripe, {
        onRampProviderConfig: {
          stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_KEY as string,
          onRampBackendUrl: 'https://aa-stripe.safe.global'
        }
      })
      setOnRampClient(onRampClient)
    })()
  }, [signer, address, fluxWalletAddress, isDeployed]);

  return (
    <DefaultLayout>
      <div className="appbox">
        {fluxWalletAddress ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-8 px-6 pb-6">
              <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Hey! 👋</h1>
              <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">Welcome To Flux Smart Wallet</h2>
            </div>

            <Card>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h2 className="font-bold text-xs text-gray-900 font-sans">AA Wallet Address</h2>
                  <p className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-2 font-mono break-all text-gray-800">{fluxWalletAddress}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">* AA address is determined counterfactually by create2</p>
                </div>
                <div>
                  <h2 className="font-bold text-xs text-gray-900 font-sans">Owner Wallet Address</h2>
                  <p className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-2 font-mono break-all text-gray-800">{owner}</p>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xs text-gray-900 font-sans">Deployed Status</h2>
                  <div>
                    {isDeployed ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        False
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <h2 className="font-bold text-xs text-gray-900 font-sans">Balance</h2>
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {ethers.utils.formatEther(balance)} ETH
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">* deposit is required for demo</p>

                <div className="flex flex-col items-center gap-2 pt-2">
                  <button
                    onClick={deploy}
                    disabled={isDeployed}
                    className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Deposit 0.1 ETH
                  </button>

                  <div className="flex justify-between w-full gap-2">
                    <label
                      htmlFor="my-modal-7"
                      className="btn btn-sm flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none rounded-full shadow-sm py-2.5 h-auto min-h-0 normal-case font-semibold text-xs text-center cursor-pointer hover:opacity-95"
                      onClick={handleCreateSession}
                    >
                      Via Stripe
                    </label>
                    <label
                      htmlFor="my-modal-6"
                      className="btn btn-sm flex-1 bg-gradient-to-r from-indigo-600 to-pink-600 text-white border-none rounded-full shadow-sm py-2.5 h-auto min-h-0 normal-case font-semibold text-xs text-center cursor-pointer hover:opacity-95"
                    >
                      Via Gelato
                    </label>
                  </div>

                  <button
                    onClick={deploy2}
                    className="w-full mt-2 py-3 rounded-full bg-black text-white hover:bg-gray-900 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Deploy
                  </button>
                </div>

                {/* Modals inside layout */}
                <div>
                  <input type="checkbox" id="my-modal-6" className="modal-toggle" />
                  <div className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box bg-white text-gray-900 relative">
                      <label htmlFor="my-modal-6" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Deploying Your Smart Contract Wallet</h3>
                      <div className="py-4 flex flex-col items-center gap-3">
                        <progress className="progress progress-primary w-56"></progress>
                      </div>
                      <div className="modal-action">
                        <label htmlFor="my-modal-6" className="btn btn-primary" onClick={deploy3}>Yay!</label>
                      </div>
                    </div>
                  </div>

                  <input type="checkbox" id="my-modal-7" className="modal-toggle" />
                  <div className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box bg-white text-gray-900 relative">
                      <label htmlFor="my-modal-7" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
                      <h3 className="font-bold text-lg text-gray-900 mb-4">Stripe Deposit</h3>
                      <div id="stripe-root" ref={stripeRootRef} className="min-h-[200px]"></div>
                      <div className="modal-action">
                        <label htmlFor="my-modal-7" className="btn btn-ghost">Close</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-8 px-6 pb-6">
              <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Flux Wallet</h1>
              <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">The Future of Web3 Smart Wallets</h2>
            </div>

            <Card>
              <div className="space-y-6 text-center text-gray-700 py-6 my-auto">
                <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse"></div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/10 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Connect Owner Wallet</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                    Connect your owner EOA wallet to create or load your counterfactual account abstraction smart wallet.
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
                            className="w-full py-3.5 rounded-xl text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/25 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:shadow-xl hover:shadow-indigo-600/35 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
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
