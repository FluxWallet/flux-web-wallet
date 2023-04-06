import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/router";
import React, { useMemo } from "react";

import { useIsDesktop } from "@/hooks/useIsDesktop";

export interface DefaultLayoutProps {
  children: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { isDesktop } = useIsDesktop();

  const currentPathBase = useMemo(() => {
    return router.asPath.split("/")[1];
  }, [router]);

  const onClickAccount = () => {
    router.push("/");
  };

  const onClickGuardian = () => {
    router.push("/social-recovery");
  };

  const onClickConnect = () => {
    router.push("/connect");
  };

  const btnClass = (isActive: boolean) =>
    `btn btn-sm ${isActive ? "bg-gray-100" : "bg-white hover:bg-gray-50 active:bg-gray-100"}`;

  return (
    <div className="flex flex-col min-h-screen">
      <section className="max-w-8xl mb-8 mx-auto px-4 w-full">
        <nav className="py-4">
          <div
            className={`flex justify-center my-4 absolute right-0 left-0 ${isDesktop ? "top-0" : "bottom-0"} h-8`}
          >
            <div className="btn-group bg-white py-1 px-1 rounded-xl shadow-md">
              <button onClick={onClickAccount} className={btnClass(currentPathBase === "")}>
                Account
              </button>
              <button onClick={onClickConnect} className={btnClass(currentPathBase === "connect")}>
                Connect
              </button>
              <button onClick={onClickGuardian} className={btnClass(currentPathBase === "social-recovery")}>
                Social Recovery
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center h-8">
            <p className="text-xl font-bold">Flux Wallet</p>
            <div className="flex items-center gap-2">
              <ConnectButton showBalance={false} chainStatus="none" />
            </div>
          </div>
        </nav>
      </section>
      <div className="max-w-2xl mx-auto px-4 w-full">
        <div>{children}</div>
      </div>
    </div>
  );
};
