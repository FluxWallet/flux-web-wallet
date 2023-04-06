import WalletConnect from "@walletconnect/client";
import { convertHexToUtf8 } from "@walletconnect/utils";
import { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
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
      {fluxWalletAddress && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <label className="text-md font-bold">
                  AccountAbstraction Address (ERC 4337)
                </label>
                <p className="text-xs">{fluxWalletAddress}</p>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {walletConnectMode === "notConnected" && (
              <div className="space-y-2">
                <div>
                  <label className="block mb-2 font-bold font-sans">Wallet Connect</label>
                  <input
                    type="text"
                    className="input input-bordered w-full text-xs"
                    value={walletConnectUri}
                    onChange={(e) => setWalletConnectUri(e.target.value)}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    * input wallet connect url to connect
                  </p>
                </div>
                <button
                  className="btn btn-primary w-full"
                  disabled={!walletConnectUri || isWalletConnectLoading}
                  onClick={connectWalletConnect}
                >
                  {isWalletConnectLoading ? <span className="loading loading-spinner"></span> : null}
                  Connect
                </button>
              </div>
            )}
            {peerMeta && (
              <div className="space-y-2">
                <p className="text-xs">{peerMeta.url}</p>
                <p className="text-xs">{peerMeta.name}</p>
              </div>
            )}
            {walletConnectMode === "connecting" && (
              <div className="space-y-2">
                <button className="btn btn-primary" onClick={approveSession}>Approve</button>
                <button className="btn btn-ghost" onClick={rejectSession}>Reject</button>
              </div>
            )}
            {walletConnectMode === "connected" && (
              <div className="space-y-2">
                <p>Connected</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default HomePage;
