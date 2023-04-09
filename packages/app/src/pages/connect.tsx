/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, FormControl, FormHelperText, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
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
        <Stack spacing="8">
          <Stack spacing="4">
            <Stack spacing="2">
              <FormControl>
                <FormLabel fontSize="md" fontWeight="bold">
                  AccountAbstraction Address (ERC 4337)
                </FormLabel>
                <Text fontSize="xs">{fluxWalletAddress}</Text>
              </FormControl>
            </Stack>
            {error && <Text color="red.500" fontSize="sm">{error}</Text>}
            {walletConnectMode === "notConnected" && (
              <Stack spacing="2">
                <FormControl>
                  <FormLabel>Wallet Connect</FormLabel>
                  <Input
                    type="text"
                    fontSize="xs"
                    value={walletConnectUri}
                    onChange={(e) => setWalletConnectUri(e.target.value)}
                  />
                  <FormHelperText fontSize="xs" color="blue.600">
                    * input wallet connect url to connect
                  </FormHelperText>
                </FormControl>
                <Button
                  w="full"
                  isLoading={isWalletConnectLoading}
                  onClick={connectWalletConnect}
                  colorScheme="brand"
                  isDisabled={!walletConnectUri}
                >
                  Connect
                </Button>
              </Stack>
            )}
            {peerMeta && (
              <Stack spacing="2">
                <Text fontSize={"xs"}>{peerMeta.url}</Text>
                <Text fontSize={"xs"}>{peerMeta.name}</Text>
              </Stack>
            )}
            {walletConnectMode === "connecting" && (
              <Stack spacing="2">
                <Button onClick={approveSession}>{"Approve"}</Button>
                <Button onClick={rejectSession}>{"Reject"}</Button>
              </Stack>
            )}
            {walletConnectMode === "connected" && (
              <Stack spacing="2">
                <Text>Connected</Text>
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
    </DefaultLayout>
  );
};

export default HomePage;
