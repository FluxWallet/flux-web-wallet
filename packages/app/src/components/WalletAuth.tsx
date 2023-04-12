// import Image from 'next/image';
// import qrcode from 'qrcode';
// import speakeasy from 'speakeasy';
import { useRouter } from 'next/router'
import React from 'react'

const WalletAuth = () => {
    const router = useRouter();

    // useEffect(() => {
    //     function fetchData() {
    //         const secret = speakeasy.generateSecret(
    //             {
    //                 name: "Flux Wallet"
    //             }
    //         )
    //         setSecret(secret.ascii);

    //         try {
    //             qrcode.toDataURL(secret.otpauth_url, function (err, data) {
    //                 // console.log(data)
    //                 console.log(secret)
    //                 setqr(data);
    //             })
    //             // setqr(code.data);
    //         } catch (err) {
    //             console.log(err);
    //         }
    //     }
    //     fetchData();
    // }, []);


    // const verfiyCode = () => {
    //     // console.log("Status "+ verified)
    //     const verified = speakeasy.totp.verify({
    //         // secret: {secret},
    //         secret: '#8s$&5]6<y}?0T[D3e9N%G*c9X0UX4q}',
    //         encoding: 'ascii',
    //         token: { auth }
    //     })
    //     console.log("Status: " + verified + " Secret: " + secret + " Auth: " + auth)
    // }

    return <div>

        <h1 className="text-2xl text-center font-bold font-sans">Scan QR Code</h1>
        <h2 className="text-sm text-center text-gray-400 font-sans "> use google authenticator</h2>


        {/* <Image src={qr} alt='qr' width={400}
            height={400} style={{ objectFit: "contain" }} /> */}
        {/* <WalletAuthVerify/> */}
        <div className='px-6 text-center'>
            <input type="String" placeholder="Enter Verification Code" className="input input-bordered w-full max-w-xs" />
        </div>

        {/* <label htmlFor="address">
            Address
            <input
                type="String"
                id="auth"
                name="auth"
                placeholder="Authencation Code"
                onChange={(e) => setAuth(e.target.value)}

            />
        </label> */}
        <div className='py-2 items-center justify-center text-center'>
            {/* <label htmlFor="my-modal-6" className="btn" onClick={verfiyCode} >Verify</label> */}
        </div>

        <input type="checkbox" id="my-modal-6" className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle">
            <div className="modal-box relative">
                <label htmlFor="my-modal-3" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>

                <h3 className="font-bold text-lg"> Wallet is getting created</h3>
                <progress className="progress w-56"></progress>

                <div className="modal-action" onClick={() => {
                    router.push('/wallet');
                }} >
                    <label htmlFor="my-modal-6" className="btn">Yay!</label>
                </div>
            </div>
        </div>

        {/* <button onClick={verfiyCode}>Verfify Code </button> */}
    </div>

    // const speakeasy = require('speakeasy')
    // const qrcode = require('qrcode')

    // const secret = speakeasy.generateSecret(
    //     {
    //         name: "Flux Wallet"
    //     }
    // )

    // console.log(secret)

    // qrcode.toDataURL(secret.otpauth_url)
    // qrcode.toDataURL(secret.otpauth_url, function (err, data) {
    //     // console.log(data)
    //     return data
    // })

    // const generateQR = async text => {
    //     try {
    //         console.log(await QRCode.toDataURL(text))
    //     } catch (err) {
    //         console.error(err)
    //     }
    // }
    // const response = await qrcode.toDataURL(text)
    // return <>
    //     <Image src={response} alt='qr' />
    //     <h1>Hello world</h1>
    // </>


    // const scan = qrcode.toDataURL(secret.otpauth_url)
    //     .then(url => {
    //         <div>

    //             <img src={url} alt='wallet 2fa' />
    //         </div>
    //     })
    //     .catch(err => {
    //         console.error(err)
    //     })

    // return (
    //     <div>
    //         <h1>Wallet Display</h1>
    //         {/* <Image src="{imageData}" fill alt='wallet 2fa' /> */}
    //         {/* <generateQR text={ } /> */}
    //         {/* { async (secret.otpauth_url) => {
    //             qrcode.toDataURL(secret.otpauth_url, function (err, data) {
    //                 console.log(data)
    //                 return <>
    //                 <img src='{data}' alt='qr' />
    //                 </>
    //             })
    //         }} */}
    //         {/* {qrcode.toDataURL(secret.otpauth_url)} */}
    //         {/* <WalletAuthVerify /> */}
    //     </div>
    // )
}

export default WalletAuth