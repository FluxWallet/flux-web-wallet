import { buildPoseidon } from "circomlibjs";
import crypto from 'crypto-browserify';
import { ethers } from 'ethers';
import base32 from 'hi-base32';
import { create } from 'ipfs-http-client';
import QRCode from 'qrcode';
import totp from "totp-generator";

const urlPrefix = "otpauth://totp/Mumbai Testnet?secret=";
const urlSuffix = "&issuer=Flux Wallet";

const authUser = process.env.NEXT_PUBLIC_IPFS_USER ?? "";
const authPass = process.env.NEXT_PUBLIC_IPFS_PASS ?? "";
const auth = 'Basic ' + Buffer.from(authUser + ':' + authPass).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

async function generateQRcode(secret: string): Promise<string> {
  return QRCode.toDataURL(urlPrefix.concat(secret).concat(urlSuffix));
}

async function generateSecret(signer: ethers.Signer, length = 20): Promise<string> {
  const randomBuffer = crypto.randomBytes(length);
  return base32.encode(randomBuffer).replace(/=/g, '');
}

export async function generateMerkleTree(): Promise<[uri: string, secret: string, root: string]> {
  const { ethereum } = window as Window & typeof globalThis & { ethereum?: ethers.providers.ExternalProvider };
  if (!ethereum) throw new Error("No Ethereum provider found");

  const provider = new ethers.providers.Web3Provider(ethereum, "any");
  const signer = provider.getSigner();

  const SECRET = await generateSecret(signer);
  const uri = await generateQRcode(SECRET);
  const startTime = Math.floor(Date.now() / 30000 - 1) * 30000;

  const poseidon = await buildPoseidon();
  const hashes: bigint[] = [];
  const tokens: Record<number, string> = {};

  for (let i = 0; i < 2 ** 7; i++) {
    const time = startTime + i * 30000;
    const token = totp(SECRET, { timestamp: time });
    tokens[time] = token;
    hashes.push(poseidon.F.toObject(poseidon([BigInt(time), BigInt(token)])));
  }

  let k = 0;

  for (let i = 2 ** 7; i < 2 ** 8 - 1; i++) {
    hashes.push(poseidon.F.toObject(poseidon([hashes[k * 2], hashes[k * 2 + 1]])));
    k++;
  }
  const root = hashes[2 ** 8 - 2];

  try {
    const fileData = await client.add(Buffer.from(hashes.toString(), 'utf-8'));
    localStorage.setItem("IPFS_CIDS", JSON.stringify([fileData]));
  } catch (err) {
    console.error(err);
  }

  localStorage.setItem("OTPhashes", hashes.map(String).join(","));
  localStorage.setItem("MerkleRoot", root.toString());

  return [uri, SECRET, root.toString()];
}

export async function generateInput(otp: string): Promise<{
  time: number;
  otp: string;
  path_elements: bigint[];
  path_index: number[];
}> {
  const stored = localStorage.getItem("OTPhashes");
  if (!stored) throw new Error("No OTP data found.");

  const hashes = stored.split(',').map((h) => BigInt(h));

  const poseidon = await buildPoseidon();

  const currentTime = Math.floor(Date.now() / 30000) * 30000;

  let currentNode = poseidon.F.toObject(poseidon([BigInt(currentTime), BigInt(otp)]));

  if (!hashes.some((h) => h === currentNode)) {
    throw new Error("Invalid OTP.");
  }

  const pathElements: bigint[] = [];
  const pathIndex: number[] = [];

  const hashIndex = new Map<bigint, number>();
  hashes.forEach((h, i) => hashIndex.set(h, i));

  for (let i = 0; i < 7; i++) {
    const idx = hashIndex.get(currentNode);
    if (idx === undefined) throw new Error("Node not found in hash tree.");
    if (idx % 2 === 0) {
      pathIndex.push(0);
      const currentIndex = idx + 1;
      pathElements.push(hashes[currentIndex]);
      currentNode = poseidon.F.toObject(poseidon([hashes[currentIndex - 1], hashes[currentIndex]]));
    } else {
      pathIndex.push(1);
      const currentIndex = idx - 1;
      pathElements.push(hashes[currentIndex]);
      currentNode = poseidon.F.toObject(poseidon([hashes[currentIndex], hashes[currentIndex + 1]]));
    }
  }

  /* eslint-disable camelcase */
  return {
    time: currentTime,
    otp,
    path_elements: pathElements,
    path_index: pathIndex,
  } as const;
  /* eslint-enable camelcase */
}
