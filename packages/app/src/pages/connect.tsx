import { ConnectButton } from "@rainbow-me/rainbowkit";
import WalletConnect from "@walletconnect/client";
import { convertHexToUtf8 } from "@walletconnect/utils";
import { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { Card } from "@/components/shared/Card";
import { useFluxWallet } from "@/hooks/useFluxWallet";
import type { PeerMeta } from "@/types";

const HomePage: NextPage = () => {
  const { fluxWalletAddress, entryPoint, fluxWalletAPI } = useFluxWallet();
  const network = useNetwork();
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const connectorRef = useRef<WalletConnect>();
  const [error, setError] = useState("");

  const [walletConnectUri, setWalletConnectUri] = useState("");
  const [isWalletConnectLoading, setIsWalletConnectLoading] = useState(false);
  const [walletConnectMode, setWalletConnectMode] = useState<"notConnected" | "connecting" | "connected">(
    "notConnected"
  );
  const [peerMeta, setPeerMeta] = useState<PeerMeta>();

  const connectWalletConnect = async () => {
    setError("");
    setIsWalletConnectLoading(true);
    try {
      const connector = new WalletConnect({ uri: walletConnectUri });
      connectorRef.current = connector;

      if (!connector.connected) {
        await connector.createSession();
      } else {
        await connector.killSession();
      }

      connector.on("session_request", (error, payload) => {
        if (error) {
          setError(error.message);
          return;
        }
        setPeerMeta(payload.params[0].peerMeta);
        setWalletConnectMode("connecting");
      });

      connector.on("call_request", async (error, payload) => {
        if (error) {
          setError(error.message);
          return;
        }
        try {
          if (payload.method === "personal_sign") {
            const message = convertHexToUtf8(payload.params[0]);
            const signature = await signer?.signMessage(message);
            await connector.approveRequest({ id: payload.id, result: signature });
          }

          if (payload.method === "eth_sendTransaction") {
            if (!fluxWalletAPI || !entryPoint || !address) return;
            const op = await fluxWalletAPI.createSignedUserOp({
              target: payload.params[0].to,
              data: payload.params[0].data,
              value: payload.params[0].value,
            });
            const { hash } = await entryPoint.handleOps([op], address);
            await connector.approveRequest({ id: payload.id, result: hash });
          }
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

      connector.on("disconnect", (error) => {
        if (error) setError(error.message);
        setWalletConnectMode("notConnected");
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsWalletConnectLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (connectorRef.current) {
        const c = connectorRef.current;
        c.on("disconnect", () => undefined);
        c.on("session_request", () => undefined);
        c.on("call_request", () => undefined);
      }
    };
  }, []);

  const approveSession = () => {
    const connector = connectorRef.current;
    if (!connector || !network.chain) return;
    connector.approveSession({ chainId: network.chain.id, accounts: [fluxWalletAddress] });
    setWalletConnectMode("connected");
  };

  const rejectSession = () => {
    const connector = connectorRef.current;
    if (!connector) return;
    connector.rejectSession();
  };

  return (
    <DefaultLayout>
      <div className="appbox">
        {fluxWalletAddress ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-8 px-6 pb-6">
              <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Connect</h1>
              <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">Sync via WalletConnect</h2>
            </div>

            <Card>
              <div className="space-y-4 text-gray-700">
                <div>
                  <label className="block text-xs font-bold text-gray-900 font-sans mb-1">
                    Smart Wallet Address
                  </label>
                  <p className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-2 font-mono break-all text-gray-800">{fluxWalletAddress}</p>
                </div>

                {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

                {walletConnectMode === "notConnected" && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block mb-1 text-xs font-bold text-gray-900 font-sans">WalletConnect URI</label>
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5"
                        placeholder="wc:..."
                        value={walletConnectUri}
                        onChange={(e) => setWalletConnectUri(e.target.value)}
                      />
                      <p className="text-[9px] text-gray-400 mt-1">
                        * Input the WalletConnect connection link from a dApp to connect
                      </p>
                    </div>
                    <button
                      className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                      disabled={!walletConnectUri || isWalletConnectLoading}
                      onClick={connectWalletConnect}
                    >
                      {isWalletConnectLoading ? <span className="loading loading-spinner w-4 h-4"></span> : null}
                      Connect
                    </button>
                  </div>
                )}

                {peerMeta && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                    {peerMeta.icons?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={peerMeta.icons[0]} alt="" className="w-8 h-8 rounded-lg" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-900">{peerMeta.name}</p>
                      <p className="text-[10px] text-gray-400">{peerMeta.url}</p>
                    </div>
                  </div>
                )}

                {walletConnectMode === "connecting" && (
                  <div className="space-y-2 pt-4">
                    <button className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 active:scale-95" onClick={approveSession}>Approve</button>
                    <button className="w-full py-3 rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold text-xs transition-all active:scale-95" onClick={rejectSession}>Reject</button>
                  </div>
                )}

                {walletConnectMode === "connected" && (
                  <div className="pt-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-xl">
                      ✓
                    </div>
                    <p className="text-xs font-semibold text-gray-800">Connected successfully to dApp!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="pt-8 px-6 pb-6">
              <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Connect</h1>
              <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">Sync via WalletConnect</h2>
            </div>

            <Card>
              <div className="space-y-6 text-center text-gray-700 py-6 my-auto">
                <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl animate-pulse"></div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/10 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Connect Owner Wallet</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                    Connect your owner EOA wallet to create or load your smart contract wallet and manage WalletConnect sessions.
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
                            className="w-full py-3.5 rounded-xl text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-blue-600/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:shadow-blue-600/35 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
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
