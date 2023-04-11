import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("circomlibjs", () => ({
  buildPoseidon: vi.fn().mockResolvedValue(
    Object.assign(
      (val: bigint[]) => val,
      {
        F: {
          toObject: (val: bigint[]) => val.reduce((a, b) => a + b, 0n),
        },
      },
    ),
  ),
}));

vi.mock("ipfs-http-client", () => ({
  create: vi.fn().mockReturnValue({ add: vi.fn() }),
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,") },
}));

import { generateInput } from "../lib/util";

const START_TIME = 1699999950000;
const LEAF_COUNT = 128;

function buildMerkleTree(startTime: number): bigint[] {
  const hashes: bigint[] = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    const time = BigInt(startTime + i * 30000);
    const token = BigInt(i.toString().padStart(6, "0"));
    hashes.push(time + token);
  }
  let k = 0;
  for (let i = LEAF_COUNT; i < 2 * LEAF_COUNT - 1; i++) {
    hashes.push(hashes[k * 2] + hashes[k * 2 + 1]);
    k++;
  }
  return hashes;
}

describe("generateInput", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START_TIME);
  });

  it("throws when no OTP data is stored", async () => {
    localStorage.clear();
    await expect(generateInput("123456")).rejects.toThrow("No OTP data found.");
  });

  it("returns correct shape with valid OTP", async () => {
    const hashes = buildMerkleTree(START_TIME);
    localStorage.setItem("OTPhashes", hashes.map(String).join(","));

    const result = await generateInput("000000");

    expect(result.otp).toBe("000000");
    expect(result.path_elements).toHaveLength(7);
    expect(result.path_index).toHaveLength(7);
    expect(result.path_index.every((i) => i === 0 || i === 1)).toBe(true);
  });

  it("throws for OTP not in the tree", async () => {
    const hashes = buildMerkleTree(START_TIME);
    localStorage.setItem("OTPhashes", hashes.map(String).join(","));

    await expect(generateInput("999999")).rejects.toThrow("Invalid OTP.");
  });
});
