# Tutorial 1: Creating a Passkey-Based Wallet

This tutorial explains how LazorKit uses WebAuthn passkeys to create and manage Solana wallets without seed phrases.

---

## What Are Passkeys?

Passkeys are a modern authentication standard (WebAuthn/FIDO2) that replace passwords with biometric authentication:

- **FaceID** on iPhone/Mac
- **TouchID** on Mac/iPhone
- **Windows Hello** on Windows devices
- **Security Keys** like YubiKey

The private key never leaves your device's secure enclave. This is the same technology used by banks and major tech companies.

---

## How LazorKit Uses Passkeys

Traditional Solana wallets require you to:
1. Generate a keypair
2. Write down a 12-24 word seed phrase
3. Store it securely (forever)

**LazorKit replaces this with:**
1. Authenticate with your fingerprint/face
2. A WebAuthn credential is created in your device's secure hardware
3. This credential controls a Smart Wallet (PDA) on Solana

```
┌─────────────────┐      ┌─────────────────┐
│  Your Device    │      │    Solana       │
│  Secure Enclave │─────▶│  Smart Wallet   │
│  (Passkey)      │      │    (PDA)        │
└─────────────────┘      └─────────────────┘
```

---

## Implementation Walkthrough

### Step 1: Set Up the Provider

First, wrap your app with `LazorkitProvider`:

```tsx
// src/app/providers.tsx
"use client";

import { LazorkitProvider } from "@lazorkit/wallet";

// Required polyfill for Next.js
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || require("buffer").Buffer;
}

const CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

export function Providers({ children }) {
  return (
    <LazorkitProvider
      rpcUrl={CONFIG.rpcUrl}
      portalUrl={CONFIG.portalUrl}
      paymasterConfig={CONFIG.paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}
```

**Key points:**
- `rpcUrl`: Your Solana RPC endpoint (Devnet for testing)
- `portalUrl`: LazorKit's authentication portal
- `paymasterConfig`: Enables gasless transactions

---

### Step 2: Use the `useWallet` Hook

The `useWallet` hook provides everything you need:

```tsx
// src/components/connect-wallet.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";

export function ConnectWallet() {
  const { 
    connect,         // Function to initiate connection
    disconnect,      // Function to disconnect
    isConnected,     // Boolean: is wallet connected?
    isConnecting,    // Boolean: is connection in progress?
    wallet           // Wallet object with addresses
  } = useWallet();

  // ... rest of component
}
```

---

### Step 3: Trigger the Passkey Flow

Call `connect()` to start the authentication:

```tsx
const handleConnect = async () => {
  try {
    await connect();
    // Success! User is now connected
  } catch (error) {
    console.error("Connection failed:", error);
  }
};
```

**What happens when `connect()` is called:**

1. LazorKit checks for existing passkey credentials
2. **If found**: Session is restored automatically (no popup)
3. **If not found**: User is prompted to create a new passkey

The user sees a native OS dialog:

```
┌─────────────────────────────────┐
│  Create Passkey for lazor.sh   │
│                                 │
│  Use Face ID to sign in?       │
│                                 │
│  [Cancel]          [Continue]   │
└─────────────────────────────────┘
```

---

### Step 4: Access Wallet Information

After connection, the `wallet` object contains:

```tsx
if (isConnected && wallet) {
  console.log("Smart Wallet Address:", wallet.smartWallet);
  // e.g., "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

This is a **Program Derived Address (PDA)** controlled by:
- Your passkey credential
- The LazorKit on-chain program

---

## Complete Example

```tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";

export function ConnectWallet() {
  const { connect, disconnect, isConnected, isConnecting, wallet } = useWallet();
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (err) {
      setError(err.message || "Connection failed");
    }
  };

  if (isConnected && wallet) {
    return (
      <div>
        <p>Connected: {wallet.smartWallet.slice(0, 8)}...</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect with Passkey"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
```

---

## Common Issues

### "WebAuthn not supported"

**Solution:** Use a modern browser (Chrome 67+, Safari 13+, Firefox 60+). Ensure you're on HTTPS (required for WebAuthn).

### "User cancelled the operation"

**Solution:** User dismissed the passkey dialog. This is not an error — just prompt them to try again.

### "Credential already exists"

**Solution:** This means the user already has a passkey for this domain. LazorKit will restore their existing session.

---

## Security Considerations

✅ **Private key never exposed** — Stored in device's secure enclave  
✅ **Phishing resistant** — Bound to the origin domain  
✅ **No seed phrase** — Nothing to write down or lose  
✅ **Biometric protected** — Requires fingerprint/face to sign  

---

## Next Steps

- [Tutorial 2: Gasless Transactions →](02-gasless-transactions.md)
- [Tutorial 3: Session Persistence →](03-session-persistence.md)
