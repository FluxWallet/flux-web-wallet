import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NextPage } from "next";
import Image from 'next/image'
import { useState } from 'react'

import { DefaultLayout } from "@/components/layouts/Default";
import { Card } from "@/components/shared/Card";
import { useFluxWallet } from "@/hooks/useFluxWallet";
import { useZkProof } from "@/hooks/useZkProof";
import { generateInput } from "@/lib/util";

const PROFILE_SRC = "/profile.webp"

const Send: NextPage = () => {

    const [otp, setOTP] = useState("");
    const [otpDisable, setOtpDisable] = useState(true);
    const [amount, setAmount] = useState("");
    const [amountDisable, setAmountDisable] = useState(true);
    const [recipient, setRecipient] = useState("");
    const [recipientDisable, setRecipientDisable] = useState(true);

    const [confirmation, setConfirmation] = useState("");
    const [success, setSuccess] = useState(false);

    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [verifying, setVerifying] = useState(false);

    const { fluxWalletAddress } = useFluxWallet()
    const { prove } = useZkProof();
    const scwAddress = fluxWalletAddress;

    const naiveProve = async (event: React.MouseEvent) => {
        event.preventDefault();
        setError(false);
        setSuccess(false);
        setVerifying(true);

        if (!localStorage.getItem("OTPhashes")) {
            setErrorMsg("No OTP data found. Authenticate first.");
            setError(true);
            setVerifying(false);
            return;
        }

        try {
            const INPUT = await generateInput(otp);

            const result = await prove(INPUT, amount, recipient);
            setConfirmation(result.receipt.transactionHash);
            setSuccess(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setErrorMsg(message);
            setError(true);
        } finally {
            setVerifying(false);
        }

    }

    const aHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOTP(event.target.value);
        setOtpDisable(event.target.value === "");
    };

    const amountHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(event.target.value);
        setAmountDisable(event.target.value === "");
    };

    const recipientHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRecipient(event.target.value);
        setRecipientDisable(event.target.value === "");
    };

    return (
        <DefaultLayout>
            <div className="appbox">
                {fluxWalletAddress ? (
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="pt-8 px-6 pb-6">
                            <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Send</h1>
                            <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">Secure Transfer with ZK-2FA</h2>
                        </div>
                        <Card>
                            <div className="space-y-4 text-gray-700">
                                {/* Profile Header */}
                                <div className="relative flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full border-2 border-indigo-500/80 p-0.5 overflow-hidden">
                                        <Image className="rounded-full" src={PROFILE_SRC} width={36} height={36} alt="profile" />
                                    </div>
                                    <span className="absolute bottom-0 left-7 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="font-bold text-sm text-gray-900 leading-none">Welcome</h1>
                                        <p className="text-[10px] text-gray-500 truncate font-mono mt-0.5">{scwAddress}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <form className="space-y-3">
                                        <div>
                                            <label htmlFor="input-recipient" className="block mb-1 text-xs font-bold text-gray-900 font-sans">Recipient Address</label>
                                            <input type="text" id="input-recipient" onChange={recipientHandler} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="0xdeaa150597535Eed8c95Ad090757815F1B9Da15d" required />
                                        </div>
                                        <div>
                                            <label htmlFor="input-amount" className="block mb-1 text-xs font-bold text-gray-900 font-sans">Amount to Transfer</label>
                                            <input type="text" onChange={amountHandler} id="input-amount" className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="0 ETH" required />
                                        </div>
                                        <div>
                                            <label htmlFor="input-otp" className="block mb-1 text-xs font-bold text-gray-900 font-sans">Verification Code (Google Auth)</label>
                                            <input type="text" inputMode="numeric" pattern="[0-9]{6}" id="input-otp" onChange={aHandler} className="bg-gray-50 border border-slate-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block w-full p-2.5 outline-none transition-all" placeholder="Code" required />
                                        </div>
                                    </form>
                                    
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            onClick={naiveProve}
                                            disabled={otpDisable || amountDisable || recipientDisable || verifying}
                                            className="w-full py-3 rounded-full text-white font-semibold text-xs shadow-md transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            {verifying ? "Generating ZK Proof..." : "Send Transaction"}
                                        </button>
                                    </div>
                                </div>

                                {verifying && (
                                    <div className="flex flex-col items-center gap-1.5 py-2">
                                        <progress className="progress progress-primary w-full max-w-[200px]"></progress>
                                        <span className="text-[9px] text-gray-400 animate-pulse">Generating cryptographic ZK-Proof...</span>
                                    </div>
                                )}
                                {error && (
                                    <p className="bg-rose-50 text-rose-800 text-[10px] p-2.5 rounded-xl border border-rose-100 font-medium break-all">{errorMsg}</p>
                                )}
                                {success && (
                                    <div className="bg-emerald-50 text-emerald-800 text-[10px] p-3 rounded-xl border border-emerald-100 font-medium space-y-1">
                                        <p>✓ Transaction submitted successfully!</p>
                                        <p className="font-mono text-[9px] break-all opacity-80">Hash: {confirmation}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="pt-8 px-6 pb-6">
                            <h1 className="text-3xl font-black tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">Send</h1>
                            <h2 className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-1">Transfer assets with ZK-2FA protection</h2>
                        </div>

                        <Card>
                            <div className="space-y-6 text-center text-gray-700 py-6 my-auto">
                                <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl animate-pulse"></div>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-orange-500 p-[2px] shadow-lg shadow-rose-500/10 flex items-center justify-center">
                                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-rose-600 translate-x-px -translate-y-px animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Connect Owner Wallet</h3>
                                    <p className="text-[13px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                                        Connect your owner EOA wallet to send transactions and generate zero-knowledge 2FA proofs.
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
                                                        className="w-full py-3.5 rounded-xl text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-rose-600/25 bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 hover:shadow-xl hover:shadow-rose-600/35 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
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
}

export default Send
