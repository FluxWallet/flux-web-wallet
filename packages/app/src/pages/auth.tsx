import { generateMerkleTree } from "@/lib/util";
import { Card } from "@/components/shared/Card";
import { DefaultLayout } from "@/components/layouts/Default";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

const AuthPage: NextPage = () => {
    const [deployed, setDeployed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uri, setURI] = useState("");
    const [authCode, setAuthCode] = useState("")

    const router = useRouter();

    const deploy = async (event: React.MouseEvent) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        setDeployed(false);

        try {
            const [_uri, _secret] = await generateMerkleTree();
            setURI(_uri);
            setDeployed(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => {
        if (!authCode) return;
        router.push("/send");
    };

    return (
        <DefaultLayout>
            <div className="appbox">
                <div id='header'>
                    <div className='pt-4 px-4'>
                        <h1 className="text-4xl text-white py-4 font-sans">
                            Hey ! 👋
                        </h1>
                        <h2 className="text-base text-white py-2 pb-10 font-sans"> Its time to secure you !</h2>
                    </div>

                    <Card>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        {loading ? (
                            <div className="flex justify-center">
                                <progress className="progress w-56"></progress>
                            </div>
                        ) : deployed ? (
                            <h2>Scan the QR code using Google Authenticator</h2>
                        ) : (
                            <button onClick={(e) => deploy(e)} className="btn flex align-middle">
                                Generate Your QR Code
                            </button>
                        )}

                        {deployed ? (
                            <div>
                                <img src={uri} width="100%" alt="flux wallet qr code" />
                                <div className='px-6 text-center'>
                                    <input type="text" placeholder="Enter Verification Code" className="input input-bordered w-full max-w-xs" onChange={(e) => setAuthCode(e.target.value)} />
                                </div>
                                <div className='py-2 items-center justify-center text-center'>
                                    <label htmlFor="my-modal-6" className="btn" onClick={handleVerify}>Verify</label>
                                </div>
                            </div>
                        ) : null}
                    </Card>
                </div>
            </div>
        </DefaultLayout >
    );
};

export default AuthPage;
