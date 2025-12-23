# Tutorial 2: Sending Gasless Transactions

This tutorial explains how LazorKit enables gasless transactions using its Paymaster service.

---

## The Problem: Gas Fees

On Solana, every transaction requires SOL to pay for:
- **Transaction fees** (~0.000005 SOL per signature)
- **Rent** (for creating new accounts)

For new users, this creates friction:
1. User creates wallet
2. User wants to receive tokens
3. Wait... they need SOL first to do anything!

---

## The Solution: Paymaster

LazorKit's **Paymaster** is a service that pays transaction fees on behalf of users:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    User      │───▶│  Paymaster   │───▶│   Solana     │
│  (No SOL)    │    │  (Pays Gas)  │    │  Network     │
└──────────────┘    └──────────────┘    └──────────────┘
```

**How it works:**
1. User signs transaction with passkey
2. Transaction is sent to Paymaster (bundler)
3. Paymaster wraps it with gas payment
4. Submitted to Solana — user pays nothing!

---

## Implementation Walkthrough

### Step 1: Configure the Paymaster

The Paymaster is configured in your provider:

```tsx
// src/app/providers.tsx
const CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com", // ← Paymaster endpoint
  },
};
```

LazorKit provides hosted Paymaster endpoints:
- **Devnet:** `https://kora.devnet.lazorkit.com`
- **Mainnet:** `https://kora.mainnet.lazorkit.com`

---

### Step 2: Use `signAndSendTransaction`

The `signAndSendTransaction` method handles the entire flow:

```tsx
import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

function SendSOL() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const handleSend = async () => {
    // 1. Create the instruction
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: new PublicKey("RECIPIENT_ADDRESS"),
      lamports: 0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
    });

    // 2. Sign and send (gasless!)
    const signature = await signAndSendTransaction({
      instructions: [instruction],
    });

    console.log("Transaction confirmed:", signature);
  };

  return <button onClick={handleSend}>Send 0.001 SOL</button>;
}
```

**What happens:**
1. `signAndSendTransaction` creates a transaction
2. User signs with passkey (biometric prompt)
3. Transaction is sent to Paymaster
4. Paymaster pays gas and submits to Solana
5. Returns the transaction signature

---

### Step 3: Handle Transaction Status

Always wrap in try/catch and show status to users:

```tsx
const [status, setStatus] = useState("idle");
const [signature, setSignature] = useState(null);
const [error, setError] = useState(null);

const handleSend = async () => {
  setStatus("pending");
  setError(null);
  
  try {
    const sig = await signAndSendTransaction({
      instructions: [instruction],
    });
    
    setSignature(sig);
    setStatus("success");
  } catch (err) {
    setError(err.message);
    setStatus("error");
  }
};
```

---

## Advanced: Fee Token Options

By default, Paymaster pays gas in SOL. You can also pay in USDC:

```tsx
const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: {
    feeToken: "USDC",  // Pay gas in USDC instead of SOL
  },
});
```

This is useful when:
- User has USDC but no SOL
- Building a stablecoin-first experience

---

## Complete Example

```tsx
"use client";

import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState } from "react";

export function SendTokens() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();
  
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("idle");
  const [signature, setSignature] = useState(null);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!smartWalletPubkey) return;
    
    setStatus("pending");
    setError(null);

    try {
      // Validate recipient address
      const recipientPubkey = new PublicKey(recipient);
      
      // Create transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL),
      });

      // Sign and send via Paymaster
      const sig = await signAndSendTransaction({
        instructions: [instruction],
      });

      setSignature(sig);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  if (!isConnected) return null;

  return (
    <div>
      <h2>Send SOL (Gasless)</h2>
      
      <input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      
      <input
        type="text"
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      
      <button onClick={handleSend} disabled={status === "pending"}>
        {status === "pending" ? "Sending..." : "Send SOL"}
      </button>

      {status === "success" && (
        <div>
          ✅ Success!{" "}
          <a 
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
          >
            View on Explorer
          </a>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
```

---

## Transaction Options

The `signAndSendTransaction` accepts these options:

| Option | Type | Description |
|--------|------|-------------|
| `instructions` | `TransactionInstruction[]` | Array of instructions to execute |
| `transactionOptions.feeToken` | `"SOL" \| "USDC"` | Token to pay gas fees |
| `transactionOptions.computeUnitLimit` | `number` | Max compute units |
| `transactionOptions.addressLookupTableAccounts` | `AddressLookupTableAccount[]` | For versioned transactions |

---

## How Paymaster Works (Under the Hood)

1. **User signs** — Passkey creates a signature over the transaction
2. **Bundling** — Paymaster wraps the user operation with a gas payment
3. **Submission** — Combined transaction is sent to Solana
4. **Settlement** — Paymaster recoups costs (business logic varies)

```
User TX:  [Transfer 0.1 SOL to Alice]
                    ↓
Bundled:  [Transfer 0.1 SOL to Alice] + [Pay gas from Paymaster]
                    ↓
Solana:   Single atomic transaction
```

---

## Common Issues

### "Transaction simulation failed"

**Possible causes:**
- Insufficient balance in smart wallet
- Invalid recipient address
- Compute budget exceeded

**Solution:** Check wallet balance and verify address format.

### "User rejected the signing request"

**Solution:** User cancelled the biometric prompt. This is expected behavior.

### "Paymaster rate limited"

**Solution:** The free Devnet paymaster has rate limits. Wait a moment and retry.

---

## Cost Considerations

On **Devnet**, the Paymaster is free for testing.

On **Mainnet**, gas sponsorship models vary:
- **Free tier** for small transactions
- **USDC fee** deducted from user
- **Subscription** for dApps

Contact the LazorKit team for Mainnet pricing.

---

## Next Steps

- [Tutorial 1: Passkey Wallet Creation ←](01-passkey-wallet-creation.md)
- [Tutorial 3: Session Persistence →](03-session-persistence.md)
