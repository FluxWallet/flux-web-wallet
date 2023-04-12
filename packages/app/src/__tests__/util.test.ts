import { describe, it, expect, vi, beforeAll } from "vitest";
import { buildPoseidon } from "circomlibjs";
import { generateInput } from "../lib/util";

const LEAF_COUNT = 128;

async function buildRealMerkleTree(startTime: number): Promise<bigint[]> {
  const poseidon = await buildPoseidon();
  const hashes: bigint[] = [];

  for (let i = 0; i < LEAF_COUNT; i++) {
    const time = BigInt(startTime + i * 30000);
    const token = BigInt(i.toString().padStart(6, "0"));
    hashes.push(poseidon.F.toObject(poseidon([time, token])));
  }

  let k = 0;
  for (let i = LEAF_COUNT; i < 2 * LEAF_COUNT - 1; i++) {
    hashes.push(poseidon.F.toObject(poseidon([hashes[k * 2], hashes[k * 2 + 1]])));
    k++;
  }

  return hashes;
}

describe("generateInput (real circomlibjs)", () => {
  const NOW = 1700000000000;

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("throws when no OTP data is stored", async () => {
    localStorage.clear();
    await expect(generateInput("123456")).rejects.toThrow("No OTP data found.");
  });

  it("verifies real Merkle path with correct OTP", async () => {
    const startTime = Math.floor(NOW / 30000 - 1) * 30000;
    const hashes = await buildRealMerkleTree(startTime);
    localStorage.setItem("OTPhashes", hashes.map(String).join(","));

    const result = await generateInput("000001");

    expect(result.otp).toBe("000001");
    expect(result.path_elements).toHaveLength(7);
    expect(result.path_index).toHaveLength(7);
    expect(result.path_index.every((i) => i === 0 || i === 1)).toBe(true);

    const poseidon = await buildPoseidon();
    let currentHash = poseidon.F.toObject(poseidon([BigInt(result.time), BigInt(result.otp)]));
    for (let i = 0; i < 7; i++) {
      const sibling = result.path_elements[i];
      currentHash = result.path_index[i] === 0
        ? poseidon.F.toObject(poseidon([currentHash, sibling]))
        : poseidon.F.toObject(poseidon([sibling, currentHash]));
    }
    const root = hashes[hashes.length - 1];
    expect(currentHash).toBe(root);
  });

  it("throws for OTP not in the tree", async () => {
    const startTime = Math.floor(NOW / 30000 - 1) * 30000;
    const hashes = await buildRealMerkleTree(startTime);
    localStorage.setItem("OTPhashes", hashes.map(String).join(","));

    await expect(generateInput("999999")).rejects.toThrow("Invalid OTP.");
  });
});
