declare module "circomlibjs" {
  interface Poseidon {
    F: {
      toObject(val: unknown): bigint;
    };
    (vals: unknown[]): unknown;
  }
  export function buildPoseidon(): Promise<Poseidon>;
}

declare module "crypto-browserify" {
  export function randomBytes(size: number): Buffer;
}

declare module "hi-base32" {
  export function encode(data: Buffer | string): string;
}

declare module "qrcode" {
  export function toDataURL(
    text: string,
    options?: Record<string, unknown>
  ): Promise<string>;
}

declare module "totp-generator" {
  export default function totp(
    secret: string,
    options?: { timestamp?: number }
  ): string;
}
