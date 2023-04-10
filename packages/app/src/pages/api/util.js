/* global BigInt */

import { buildPoseidon } from "circomlibjs";
import crypto from 'crypto-browserify';
import { ethers } from 'ethers'
import base32 from 'hi-base32';
import { create } from 'ipfs-http-client';
import QRCode from 'qrcode';
import totp from "totp-generator";

// import vrf from './artifacts/vrf.json'

const urlPrefix = "otpauth://totp/Mumbai Testnet?secret=";
const urlSuffix = "&issuer=Flux Wallet";

// const VRF_ADDRESS = "0x72B47B0450F10D5Bca027C992DC16f144c84819C"

const auth = 'Basic ' + Buffer.from(process.env.NEXT_PUBLIC_IPFS_USER + ':' + process.env.NEXT_PUBLIC_IPFS_PASS).toString('base64');

const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});
// console.log("Client create:" + `${JSON.stringify(client)}`);

async function generateQRcode(secret) {
    return await QRCode.toDataURL(urlPrefix.concat(secret).concat(urlSuffix));
}

async function generateSecret(signer, length = 20) {
    const randomBuffer = crypto.randomBytes(length);
    // const VRF = new ethers.Contract(VRF_ADDRESS, vrf.VRF_ABI, signer);
    // console.log(VRF);
    // let reqId = await VRF.lastRequestId();
    // console.log(`reqId: ${reqId}`)

    // let st = await VRF.getRequestStatus(reqId)
    // console.log(`st: ${st}`)
    // const tx =  await VRF.requestRandomWords()
    // const randomBuffer = st[1];

    // console.log(`randomBuffer: ${randomBuffer}`)
    return base32.encode(randomBuffer).replace(/=/g, '');
}

export async function generateMerkleTree() {
    if (typeof window === "undefined") {
        throw new Error("generateMerkleTree can only be called in browser environment");
    }
    const { ethereum } = window;

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    console.log("Signer:" + signer)

    const SECRET = await generateSecret(signer);
    console.log("Secret:" + SECRET)
    const uri = await generateQRcode(SECRET);
    const startTime = Math.floor(Date.now() / 30000 - 1) * 30000;

    const poseidon = await buildPoseidon();
    const hashes = [];
    const tokens = {};

    for (let i = 0; i < 2 ** 7; i++) {
        const time = startTime + i * 30000;
        const token = totp(SECRET, { timestamp: time });
        tokens[time] = token;
        hashes.push(poseidon.F.toObject(poseidon([BigInt(time), BigInt(token)])));
    }
    // console.log(tokens);
    // console.log(hashes);

    // compute root
    let k = 0;

    for (let i = 2 ** 7; i < 2 ** 8 - 1; i++) {
        hashes.push(poseidon.F.toObject(poseidon([hashes[k * 2], hashes[k * 2 + 1]])));
        k++;
    }
    const root = hashes[2 ** 8 - 2];
    console.log("Merkle root:", root);
    let fileData;
    try {
        fileData = await client.add(Buffer.from(hashes.toString(), 'utf-8'));
    } catch (err) {
        console.log(err);
    }
    console.log("Hashes on IPFS", fileData)
    let IPFS_CIDS = [];
    const stored = localStorage.getItem("IPFS_CIDS");
    if (stored) {
        try { IPFS_CIDS = JSON.parse(stored); } catch { IPFS_CIDS = []; }
    }
    if (fileData) IPFS_CIDS.push(fileData);
    localStorage.setItem("IPFS_CIDS", JSON.stringify(IPFS_CIDS));
    localStorage.setItem("OTPhashes", hashes.map(String).join(","));
    localStorage.setItem("MerkleRoot", String(root));

    const r = localStorage.getItem("MerkleRoot");
    console.log(`fetched root: ${r}`)

    return [uri, SECRET, root];
}

export async function generateInput(otp) {

    const hashes = localStorage.getItem("OTPhashes").split(',').map(BigInt);

    console.log(hashes);

    const poseidon = await buildPoseidon();

    const currentTime = Math.floor(Date.now() / 30000) * 30000;

    let currentNode = poseidon.F.toObject(poseidon([BigInt(currentTime), BigInt(otp)]));
    // console.log(currentNode);

    if (hashes.indexOf(currentNode) < 0) {
        throw new Error("Invalid OTP.");
    }

    const pathElements = [];
    const pathIndex = [];

    for (let i = 0; i < 7; i++) {
        if (hashes.indexOf(currentNode) % 2 === 0) {
            pathIndex.push(0);
            const currentIndex = hashes.indexOf(currentNode) + 1;;
            // console.log(currentIndex);
            pathElements.push(hashes[currentIndex]);
            currentNode = poseidon.F.toObject(poseidon([hashes[currentIndex - 1], hashes[currentIndex]]));
        } else {
            pathIndex.push(1);
            const currentIndex = hashes.indexOf(currentNode) - 1;
            // console.log(currentIndex);
            pathElements.push(hashes[currentIndex]);
            currentNode = poseidon.F.toObject(poseidon([hashes[currentIndex], hashes[currentIndex + 1]]));
        }
    }

    return ({
        "time": currentTime,
        otp,
        "path_elements": pathElements,
        "path_index": pathIndex
    })
}