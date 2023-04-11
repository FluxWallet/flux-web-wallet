import { NextPage } from "next";
import Image from 'next/image'
import { useState } from 'react'

import { DefaultLayout } from "@/components/layouts/Default";
import { useFluxWallet } from "@/hooks/useFluxWallet";
import { useZkProof } from "@/hooks/useZkProof";
import { generateInput } from "@/lib/util";

import profile from './../static/profile.webp'

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
            setErrorMsg("No OTP contract address found. Deploy first.");
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

        event.preventDefault();
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
            <div className='appbox bg-white h-full'>
                <div className="h-[600px]">
                    <div className='pt-8 px-4'>
                        <div className="relative flex row">
                            <div className="w-10 h-10 p-1 rounded-full border-2 border-indigo-500/100">
                                <Image className="w-10 h-10 rounded-full" src={profile} alt="" />
                            </div>
                            <span className="top-0 left-7 absolute  w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
                            <div className='px-4 items-center'>
                                <h1 className='font-bold text-lg'>Welcome</h1>
                                <h1 className='text-[9px]'>{scwAddress}</h1>
                            </div>
                        </div>

                        <div className="relative my-5 w-full">
                            <h1 className="text-2xl pb-5 font-bold font-sans">Send Transaction</h1>

                            <form>
                                <div className="mb-6">
                                    <label htmlFor="text"
                                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Recipient Address</label>
                                    <input type="text" id="input-recipient" onChange={recipientHandler} className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light" placeholder="0xdeaa150597535Eed8c95Ad090757815F1B9Da15d" required />
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="tokens" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Enter Amount To Transfer</label>
                                    <input type="text" onChange={amountHandler} id="input-amount" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light" placeholder="0 ETH" required />
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Enter Verification Code</label>
                                    <input type="number" id="input-otp" onChange={aHandler}
                                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light" placeholder="Code" required />
                                </div>
                                <button type="submit" onClick={naiveProve}
                                    disabled={otpDisable || amountDisable || recipientDisable} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Send</button>
                            </form>
                        </div>

                        {verifying ? <progress className="progress w-56"></progress> : null}
                        {error ? (
                            <p className="alert-error">{errorMsg}</p>
                        ) : null}
                        {success ? (
                            <div>
                                <p className="alert-success">
                                    Please check your scw for confirmation {scwAddress}
                                </p>
                                <p>Tx hash: {confirmation}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </DefaultLayout >
    )
}

export default Send
