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

