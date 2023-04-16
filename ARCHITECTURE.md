# Flux Wallet — Architecture

## Overview

Flux Wallet is a smart contract wallet built on **ERC-4337 Account Abstraction**. It combines a React/Next.js frontend with on-chain Solidity contracts and off-chain zero-knowledge proof generation. The core innovation is **OTP-based 2FA** verified through **ZK proofs** — users authenticate transactions with Google Authenticator codes, proven on-chain without ever exposing their secret.

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Web App)                     │
│  Next.js 12 · React 18 · Wagmi 0.6 · RainbowKit         │
│  TailwindCSS · daisyUI                                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Dashboard │  │   Auth   │  │   Send   │  │ Connect │ │
│  │  (index)  │  │  (2FA)   │  │  (ZK tx) │  │ (WC v1) │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Recovery │  │  Confirm │  │ Social   │               │
│  └──────────┘  └──────────┘  │ Recovery │               │
│                              └──────────┘               │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                   API Layer (Next.js)                     │
│  ┌──────────────────────────────────────────────────────┐│
│  │  POST /api/generate-calldata                         ││
│  │  - Receives ZK circuit input from client             ││
│  │  - Loads circuit WASM + proving key                  ││
│  │  - Generates witness → proves via Groth16            ││
│  │  - Returns Solidity calldata for on-chain verification││
│  └──────────────────────────────────────────────────────┘│
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│              ERC-4337 Bundler Network                     │
│  ┌──────────────────────┐ ┌────────────────────────────┐ │
│  │  UserOperation       │ │  EntryPoint Contract       │ │
│  │  {sender, nonce,     │ │  - verifies signatures     │ │
│  │   initCode, callData,│ │  - validates paymaster     │ │
│  │   ...}               │ │  - executes through wallet │ │
│  └─────────┬────────────┘ └───────────┬────────────────┘ │
└────────────┼──────────────────────────┼──────────────────┘
             │                          │
┌────────────▼──────────────────────────▼──────────────────┐
│                   Smart Contracts (Solidity)              │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  FluxWallet.sol (main wallet)                        ││
│  │  - ERC-4337 compatible                               ││
│  │  - zkProof() — execute tx with ZK proof              ││
│  │  - SocialRecover — guardian-based recovery            ││
│  │  - DeadManSwitch — inactivity timeout                 ││
│  │  - SessionManagement — session keys                   ││
│  └──────────────────────────────────────────────────────┘│
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐│
│  │ OTP.sol    │  │ OTPFactory   │  │ Verifier.sol      ││
│  │ - stores   │  │ .sol         │  │ - Groth16 ZK      ││
│  │   Merkle   │  │ - deploys    │  │   proof verify    ││
│  │   root     │  │   OTP        │  │                   ││
│  │ - ZK proof │  │   instances  │  │                   ││
│  │   validate │  │              │  │                   ││
│  └────────────┘  └──────────────┘  └───────────────────┘│
│  ┌──────────────────────────────────────────────────────┐│
│  │  FluxWalletDeployer.sol — CREATE2 counterfactual     ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

## 1. Directory Structure

```
flux-wallet/
│
├── packages/
│   ├── app/                          # Next.js web application
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── _app.tsx          # Root app — Wagmi + RainbowKit providers
│   │   │   │   ├── index.tsx         # Dashboard — wallet status, deposit, on-ramp
│   │   │   │   ├── auth.tsx          # 2FA setup — QR code + OTP generation
│   │   │   │   ├── send.tsx          # Send transaction — OTP input + ZK proof
│   │   │   │   ├── connect.tsx       # WalletConnect integration
│   │   │   │   ├── recovery.tsx      # Social recovery flow
│   │   │   │   ├── recovery-confirm.tsx
│   │   │   │   ├── social-recovery.tsx
│   │   │   │   ├── globals.css       # Tailwind + daisyUI styles
│   │   │   │   └── api/
│   │   │   │       └── generate-calldata.js  # API route: ZK proof → calldata
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useFluxWallet.ts      # Core hook — wallet state, address, balance
│   │   │   │   ├── useZkProof.ts         # ZK proof hook — submits proof tx
│   │   │   │   ├── useContract.ts        # OTP contract interactions
│   │   │   │   ├── useIsMounted.tsx      # SSR hydration guard
│   │   │   │   ├── useIsDesktop.tsx      # Responsive breakpoint hook
│   │   │   │   └── useIsWagmiConnected.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── layouts/
│   │   │   │   │   └── Default/         # DefaultLayout — nav + content shell
│   │   │   │   └── shared/
│   │   │   │       └── Card.tsx         # Reusable card component
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── util.ts              # Core: Merkle tree gen, input gen, IPFS
│   │   │   │   ├── wallet/index.ts      # Wagmi + RainbowKit + Web3Auth config
│   │   │   │   └── theme/index.ts       # RainbowKit custom theme
│   │   │   │
│   │   │   ├── circuit_js/
│   │   │   │   ├── generate_calldata.js # Client: fetches calldata from API
│   │   │   │   ├── generate_witness.js  # Client-side witness generation
│   │   │   │   └── witness_calculator.js # WASM witness calculator
│   │   │   │
│   │   │   ├── config/
│   │   │   │   └── deployments.json     # Per-network contract addresses
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── index.ts             # Shared TypeScript types
│   │   │   │
│   │   │   └── __tests__/
│   │   │       ├── api.test.ts          # API route tests
│   │   │       ├── hooks.test.tsx       # Hook tests
│   │   │       ├── util.test.ts         # Utility tests
│   │   │       └── setup.ts             # Test globals (matchMedia)
│   │   │
│   │   ├── public/
│   │   │   ├── circuit.wasm             # ZK circuit WASM (proving)
│   │   │   └── circuit_final.zkey       # Groth16 proving key
│   │   │
│   │   ├── scripts/
│   │   │   └── build.js                 # Build: copies ZK artifacts to public/
│   │   │
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── vitest.config.ts
│   │
│   └── contracts/                       # Solidity smart contracts
│       ├── contracts/
│       │   ├── FluxWallet.sol           # Main smart contract wallet
│       │   ├── FluxWalletDeployer.sol   # CREATE2 factory for counterfactual
│       │   ├── OTP.sol                  # OTP verification with ZK proofs
│       │   ├── OTPFactory.sol           # Deploys OTP instances
│       │   ├── verifier.sol             # Groth16 proof verifier
│       │   ├── MockPaymaster.sol        # Test paymaster (ERC-4337)
│       │   ├── core/                    # ERC-4337 core (EntryPoint, BaseWallet)
│       │   ├── features/                # Wallet features
│       │   │   ├── SocialRecover.sol    # Guardian-based recovery
│       │   │   ├── DeadManSwitch.sol    # Inactivity timeout
│       │   │   ├── SessionManagement.sol # Session keys
│       │   │   └── AccessGrants.sol     # Granular access control
│       │   ├── interfaces/              # ERC-4337 interfaces
│       │   └── utils/
│       │
│       └── lib/
│           ├── FluxWalletAPI.ts         # ERC-4337 API class (extends SimpleWalletAPI)
│           └── utils.ts                 # Address/bytes constants
│
├── vercel.json                          # Vercel deployment config
├── .gitignore
├── ARCHITECTURE.md                      # This file
└── README.md
```

---

## 2. Frontend Architecture

### 2.1 Page Flow

```
User opens app → index.tsx (not connected state)
                      │
                      ▼ Connect wallet (RainbowKit)
                      │
                      ▼ index.tsx (connected state)
                     /│\
                    / │ \
                   ▼  ▼  ▼
              auth  send  connect  recovery
              (2FA) (tx)  (WC)    (social)
```

### 2.2 App Entry Point (`_app.tsx`)

The root component wraps the app in three layers:

```
<WagmiConfig>           ← Wagmi client (wallet connection state)
  <RainbowKitProvider>  ← Wallet UI + network switching
    <NetworkReloadWatcher>  ← Reloads page on chain switch
      <Component />    ← Page content
```

Key detail: `useIsMounted()` returns `null` during SSR to prevent hydration errors (Wagmi/RainbowKit use browser APIs).

### 2.3 Wallet Configuration (`lib/wallet/index.ts`)

- **Networks:** localhost, Sepolia, Goerli
- **Providers:** Infura (API key from env) + public fallback
- **Connectors:** MetaMask, WalletConnect, Rainbow, Web3Auth (social login)
- **Auto-connect:** enabled

### 2.4 Routing

Next.js file-system routing (no `next/router` custom config):

| Path | Page | Description |
|---|---|---|
| `/` | `index.tsx` | Dashboard — wallet info, deposit, on-ramp |
| `/auth` | `auth.tsx` | 2FA setup — generate QR code, deploy OTP |
| `/send` | `send.tsx` | Send transaction with OTP + ZK proof |
| `/connect` | `connect.tsx` | WalletConnect v1 session management |
| `/recovery` | `recovery.tsx` | Start social recovery |
| `/recovery-confirm` | `recovery-confirm.tsx` | Confirm recovery |
| `/social-recovery` | `social-recovery.tsx` | Guardian recovery actions |

---

## 3. Smart Contract Architecture

### 3.1 FluxWallet.sol

The core wallet contract. Implements ERC-4337 `IWallet` interface and inherits feature modules:

```
FluxWallet
├── BaseWallet         ← ERC-4337 wallet logic (validateUserOp, execute)
├── SocialRecover      ← Guardian-based recovery
├── DeadManSwitch      ← Inactivity timeout → recovery mode
├── SessionManagement  ← Authorized session keys
└── Custom:
    ├── setMerkleRootAndVerifier()  ← Stores OTP Merkle root + verifier address
    └── zkProof()                   ← Executes transaction with ZK proof
```

**`zkProof()` function:**
1. Verifies Groth16 proof via `verifier.sol`
2. Checks proof input includes the stored Merkle root
3. Executes the transaction (transfer ETH/tokens)

### 3.2 OTP.sol

Per-user OTP verification contract deployed by `OTPFactory`. Stores:
- `verifierAddr` — Groth16 verifier contract address
- `root` — Merkle tree root of valid OTP hashes
- `lastUsedTime` — Replay protection (each OTP valid once)

The `isValidProof` modifier:
1. Verifies the Groth16 proof
2. Checks the proof's public input contains the correct Merkle root
3. Ensures the timestamp in the proof is greater than `lastUsedTime` (prevents replay)

### 3.3 FluxWalletDeployer.sol

CREATE2 factory for counterfactual wallet addresses. Users can compute their wallet address before deploying (no on-chain tx needed to know where their wallet will be).

### 3.4 ERC-4337 Core

- **EntryPoint.sol** — Global entry point for all UserOperations. Validates signatures, handles paymaster logic, executes batched UserOps.
- **BaseWallet.sol** — Minimal ERC-4337 wallet implementation. `validateUserOp()` and `execute()`.
- **BasePaymaster.sol** — Optional gas sponsorship.
- **StakeManager.sol** — Manages stakes for bundlers and paymasters.

### 3.5 Verifier.sol

Auto-generated Groth16 verifier from Circom compilation. Implements `verifyProof()` which takes `(a, b, c, input)` and returns a boolean.

---

## 4. ZK Proof Flow

This is the core innovation. The system uses a custom Circom circuit to prove knowledge of a valid OTP without revealing the TOTP secret.

### 4.1 Setup Phase (auth.tsx)

```
User clicks "Generate QR Code"
        │
        ▼
lib/util.ts: generateMerkleTree()
        │
        ├─ Generate random TOTP secret (crypto.randomBytes → base32)
        ├─ Generate QR code URI → render QR for Google Authenticator
        ├─ Compute 128 future OTP tokens (64 minutes at 30s intervals)
        ├─ Hash each (timestamp + OTP) with Poseidon
        ├─ Build Merkle tree from hashes → compute root
        ├─ Upload hashes to IPFS (backup)
        └─ Store in localStorage: OTPhashes, MerkleRoot
        │
        ▼
useContract.ts: deployOTP(root)
        │
        └─ Deploy OTP.sol with Merkle root on-chain
```

### 4.2 Transaction Phase (send.tsx)

```
User enters: recipient, amount, OTP code
        │
        ▼
lib/util.ts: generateInput(otp)
        │
        ├─ Get current timestamp (rounded to 30s window)
        ├─ Hash (timestamp + OTP) with Poseidon
        ├─ Find hash in stored Merkle tree (OTPhashes)
        ├─ Generate Merkle proof path (7 levels)
        └─ Return { time, otp, path_elements, path_index }
        │
        ▼
circuit_js/generate_calldata.js → POST /api/generate-calldata
        │
        ▼
Server API: generate-calldata.js
        │
        ├─ Load circuit.wasm → compute witness
        ├─ Load circuit_final.zkey → Groth16 prove
        ├─ Export Solidity calldata
        └─ Return [a, b, c, inputValues]
        │
        ▼
useZkProof.ts: prove(input, amount, recipient)
        │
        ├─ Parse calldata into Groth16 proof format
        ├─ Call FluxWallet.zkProof(a, b, c, input, amount, recipient)
        │
        ▼
On-chain:
  FluxWallet.zkProof()
    → verifier.verifyProof(a, b, c, input)  // Groth16 verify
    → OTP checks: Merkle root match + timestamp > lastUsed
    → Transfer ETH/tokens to recipient
```

### 4.3 ZK Circuit

The Circom circuit (compiled to `circuit.wasm` + `circuit_final.zkey`):

```
Public inputs:  [MerkleRoot, timestamp]
Private inputs: [otp, pathElements[7], pathIndices[7]]

Logic:
  1. Compute poseidon(timestamp, otp) → leaf
  2. For i in 0..7:
       if pathIndices[i] == 0:
         leaf = poseidon(leaf, pathElements[i])
       else:
         leaf = poseidon(pathElements[i], leaf)
  3. Assert leaf == MerkleRoot
```

---

## 5. Authentication Flow

### 5.1 First-time setup

1. User connects EOA wallet (MetaMask, WalletConnect, Web3Auth)
2. Navigates to `/auth`
3. Clicks "Generate Your QR Code"
4. Browser generates a random TOTP secret
5. QR code displayed — user scans with Google Authenticator
6. Merkle tree of 128 future OTPs computed in-browser
7. OTP contract deployed on-chain with the Merkle root
8. User enters a verification code → if valid, redirected to `/send`

### 5.2 Subsequent logins

1. User connects wallet
2. Checks localStorage for existing `OTPhashes` and `MerkleRoot`
3. If found, OTP contract is already deployed — user can transact
4. If not found, user must re-run the auth flow

---

## 6. Account Abstraction (ERC-4337)

### 6.1 Key Contracts

- **EntryPoint** — Singleton contract that processes all UserOperations
- **FluxWalletAPI** (`contracts/lib/`) — TypeScript class extending `SimpleWalletAPI` from `@account-abstraction/sdk`
  - Creates signed UserOperations
  - Generates wallet init code (CREATE2 deployment)
  - Computes counterfactual wallet addresses

### 6.2 UserOperation Flow

```
Frontend                          Bundler                    EntryPoint
  │                                 │                           │
  │ ──createSignedUserOp()────►     │                           │
  │   {sender, nonce, initCode,     │                           │
  │    callData, signature, ...}    │                           │
  │                                 │                           │
  │                                 │ ──handleOps()─────────►   │
  │                                 │                           │
  │                                 │                           ├─ validate signature
  │                                 │                           ├─ if initCode != 0:
  │                                 │                           │    deploy wallet via factory
  │                                 │                           ├─ execute callData on wallet
  │                                 │                           └─ return hash
  │                                 │ ◄─────────────────────────│
  │ ◄──────receipt──────────────────│                           │
```

### 6.3 Counterfactual Address

Wallet addresses are deterministically computed via CREATE2 before deployment:

```
walletAddress = CREATE2(
  deployerAddress,
  keccak256(entryPoint, ownerAddress, salt),
  keccak256(initCode)
)
```

This means:
- Users know their wallet address before deploying
- Deposits can be made to the address before deployment
- First transaction deploys the wallet automatically

---

## 7. WalletConnect Integration

**Note:** Currently uses `@walletconnect/client` (WalletConnect v1, deprecated June 2023).

```
connect.tsx
  │
  ├─ User pastes WC URI from dApp
  ├─ Creates WalletConnect connector
  ├─ Handles session_request → user approves/rejects via UI
  ├─ Handles call_request:
  │   ├─ personal_sign → sign with EOA (signer)
  │   └─ eth_sendTransaction → create UserOp via FluxWalletAPI,
  │      submit through EntryPoint, approve on WC
  └─ Handles disconnect → resets state
```

---

## 8. On-ramp (Stripe via Safe)

```
index.tsx: handleCreateSession()
  │
  ├─ Initializes SafeOnRampKit with Stripe (on mount)
  ├─ Opens Stripe on-ramp widget in modal
  ├─ User buys crypto with fiat
  └─ Funds arrive in smart wallet address
```

---

## 9. Data Storage

### 9.1 localStorage Keys

| Key | Content | Set By |
|---|---|---|
| `OTPhashes` | Comma-separated Merkle tree hashes | `generateMerkleTree()` |
| `MerkleRoot` | Single root hash | `generateMerkleTree()` |
| `OTPaddress` | Deployed OTP contract address | `deployOTP()` |
| `IPFS_CIDS` | IPFS file CIDs (backup) | `generateMerkleTree()` |
| `${address}:${network}` | Cached smart wallet address | `useFluxWallet` |

### 9.2 IPFS

OTP hash arrays are uploaded to IPFS via Infura as a backup. The client uses:
- `NEXT_PUBLIC_IPFS_USER` / `NEXT_PUBLIC_IPFS_PASS` for Infura IPFS Basic auth

---

## 10. Deployment Configuration

`src/config/deployments.json` maps contract addresses per network:

```json
{
  "sepolia": {
    "entryPoint": "0x43ccc7277E12d6dD3363B9897e0cf5BB22e93735",
    "factory": "0xfaf2900c2063573f2faa347d0f5e735f403eb66a"
  },
  "goerli": {
    "entryPoint": "0xB890B15AF9bF4edcE2d39D5Ef321D33d876f8378",
    "factory": "0xa2b9773c8ddc3dcac62432a874c41201da2f01bf"
  },
  "chiado": {
    "factory": "0x33a15964328a3419ec55f6192fccb81a3e3861e2"
  }
}
```

---

## 11. Security Considerations

### 11.1 OTP Merkle Tree Window

The tree contains **128 leaves** (2^7 levels), giving **64 minutes** of valid OTPs at 30-second intervals. After expiration:
- New OTPs cannot be generated (secret not on device)
- Existing stored OTP hashes are useless
- Recovery requires the wallet owner EOA to call `setMerkleRootAndVerifier` on the FluxWallet contract

### 11.2 Guarded Functions

`setGuardians()` and `setMerkleRootAndVerifier()` in `FluxWallet.sol` should be restricted to `onlyOwner` to prevent:
- Guardian hijacking (unauthorized address sets their own guardians)
- Merkle root overwrite without authentication

### 11.3 Replay Protection

OTP.sol tracks `lastUsedTime` — each OTP timestamp can only be used once. Combined with the 30s TOTP window, each code is valid for a maximum of 2 intervals.

### 11.4 Frontend Security

- IPFS credentials are exposed client-side as `NEXT_PUBLIC_` variables
- The OTP secret is generated in-browser and never transmitted
- ZK proof generation happens server-side via the `/api/generate-calldata` endpoint (API key protected)

---

## 12. Build & Deploy

### 12.1 Monorepo Setup

Yarn workspaces with two packages:

```
root/
├── packages/app/          # Next.js app
└── packages/contracts/    # Hardhat + Solidity
```

**Build order:**
1. `yarn prebuild:contracts` — Hardhat compile → generates typechain types
2. `yarn build:app` — Next.js build (uses typechain from step 1)

### 12.2 Vercel Deployment

- **Root Directory:** `packages/app`
- **Framework:** Next.js
- **Build:** `next build` (contract artifacts are pre-committed)
- **Environment:** `.env.development` (set in Vercel dashboard)

---

## 13. Key Dependencies

| Package | Purpose |
|---|---|
| `wagmi` 0.6 | Wallet connection state management |
| `@rainbow-me/rainbowkit` 0.6 | Wallet UI (connect modal, account display) |
| `ethers` 5.7 | Ethereum interaction (providers, contracts, utils) |
| `snarkjs` 0.6 | Groth16 ZK proving (server-side) |
| `circomlibjs` | Poseidon hash for Merkle tree |
| `circom` | ZK circuit compiler (development) |
| `totp-generator` | TOTP code generation |
| `@account-abstraction/contracts` | ERC-4337 EntryPoint + interfaces |
| `@account-abstraction/sdk` | SimpleWalletAPI base class |
| `qrcode` | QR code generation for 2FA setup |
| `ipfs-http-client` | IPFS upload for hash backup |
| `@safe-global/onramp-kit` | Stripe fiat on-ramp |
| `crypto-browserify` | Client-side random bytes for secret generation |
| `hi-base32` | Base32 encoding for TOTP secrets |
