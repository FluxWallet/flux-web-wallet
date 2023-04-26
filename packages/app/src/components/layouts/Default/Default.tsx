import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/router";
import React, { useMemo } from "react";

export interface DefaultLayoutProps {
  children: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const router = useRouter();

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
    `btn btn-sm border-none normal-case rounded-lg text-xs font-semibold px-4 transition-all ${
      isActive
        ? "bg-white text-gray-950 shadow-sm hover:bg-white"
        : "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/10"
    }`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
      <header className="w-full bg-[#F8F9FA]/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6 border-b border-gray-200/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <p className="text-xl font-extrabold tracking-tight text-gray-900">Flux Wallet</p>
            <span className="group relative inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200/50 shadow-sm select-none cursor-help">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              Goerli Only (eth-infinitism)
              
              {/* Tooltip explaining why Goerli is required */}
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-gray-900 text-white text-[11px] font-normal leading-relaxed p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 border border-gray-800">
                <strong className="block text-amber-400 font-bold mb-1">Why Goerli?</strong>
                This app runs strictly on Goerli because the account abstraction entrypoints, paymasters, ZK-2FA verifiers, and eth-infinitism reference bundlers are deployed at Goerli addresses.
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-gray-900"></span>
              </span>
            </span>
          </div>

          {/* Navigation Group */}
          <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-200/20">
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

          {/* Connect Button */}
          <div className="flex items-center gap-2">
            <ConnectButton showBalance={false} chainStatus="none" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col items-center justify-center py-10 px-4">
        {children}
      </main>
    </div>
  );
};

