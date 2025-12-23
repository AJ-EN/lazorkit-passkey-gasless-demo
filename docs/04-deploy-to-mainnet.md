# Tutorial 4: Deploying to Mainnet

This tutorial covers how to take your LazorKit application from Devnet to Mainnet production.

---

## Overview

Moving from Devnet to Mainnet involves:

1. Changing environment variables
2. Using the Mainnet Paymaster
3. Updating token addresses
4. Production considerations

---

## Environment Configuration

### Step 1: Create Production Environment

Create a `.env.production` file (or update `.env.local` for production):

```env
# Production Mainnet Configuration
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER=https://kora.mainnet.lazorkit.com
```

### Step 2: Using a Premium RPC (Recommended)

The public Solana RPC has rate limits. For production, use a dedicated RPC provider:

| Provider | Free Tier | Link |
|----------|-----------|------|
| Helius | 100k credits/month | [helius.dev](https://helius.dev) |
| QuickNode | 10M API credits/month | [quicknode.com](https://quicknode.com) |
| Alchemy | 300M compute units/month | [alchemy.com](https://alchemy.com) |

Example with Helius:
```env
NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

---

## Token Address Updates

Devnet and Mainnet use different token addresses:

### USDC Mint Addresses

| Network | USDC Mint Address |
|---------|-------------------|
| **Devnet** | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| **Mainnet** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

Update your code to use environment-based token addresses:

```typescript
// src/constants/tokens.ts

export const USDC_MINT = {
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

// Determine network from RPC URL
const isMainnet = process.env.NEXT_PUBLIC_SOLANA_RPC?.includes("mainnet");
export const CURRENT_USDC_MINT = isMainnet ? USDC_MINT.mainnet : USDC_MINT.devnet;
```

---

## Paymaster Differences

### Devnet Paymaster
- **Free** — Unlimited gasless transactions for testing
- URL: `https://kora.devnet.lazorkit.com`

### Mainnet Paymaster
- **Paid** — Gas sponsorship has costs
- URL: `https://kora.mainnet.lazorkit.com`
- Contact LazorKit team for pricing

### Sponsorship Models

LazorKit offers different mainnet models:

| Model | How It Works |
|-------|--------------|
| **Free Tier** | Limited free transactions per user |
| **User Pays** | Gas fee deducted from user's USDC balance |
| **App Sponsors** | Your app pays for user gas (subscription model) |

---

## Explorer Links

Update Solana Explorer links for the correct cluster:

```tsx
// Devnet
<a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}>

// Mainnet (remove cluster param or use 'mainnet-beta')
<a href={`https://explorer.solana.com/tx/${signature}`}>
```

Helper function:

```typescript
const getExplorerUrl = (signature: string) => {
  const isMainnet = process.env.NEXT_PUBLIC_SOLANA_RPC?.includes("mainnet");
  const cluster = isMainnet ? "" : "?cluster=devnet";
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
};
```

---

## Deployment Checklist

### Before Going Live

- [ ] Switch to Mainnet RPC URL
- [ ] Switch to Mainnet Paymaster URL
- [ ] Update USDC mint address
- [ ] Remove hardcoded "devnet" references in UI
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Test with small amounts first

### Vercel Environment Variables

In your Vercel dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add production variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SOLANA_RPC` | Your mainnet RPC |
| `NEXT_PUBLIC_LAZORKIT_PAYMASTER` | `https://kora.mainnet.lazorkit.com` |

3. Click **Save**
4. **Redeploy** the project

---

## Security Considerations

### ✅ Do

- Use HTTPS everywhere (required for passkeys)
- Store sensitive keys in environment variables
- Implement proper error handling
- Add transaction confirmation modals for large amounts
- Log errors to a monitoring service

### ❌ Don't

- Expose private keys in frontend code
- Trust user input without validation
- Skip amount confirmation for large transfers
- Ignore transaction errors

---

## Testing on Mainnet

Before full launch:

1. **Test with small amounts** — Send 0.001 SOL first
2. **Verify passkey flow** — Works on target devices
3. **Check Paymaster** — Transactions are sponsored correctly
4. **Monitor errors** — Watch logs for issues

---

## Cost Estimation

Approximate Solana Mainnet costs:

| Operation | Cost |
|-----------|------|
| SOL Transfer | ~0.000005 SOL (~$0.001) |
| Token Transfer (ATA exists) | ~0.000005 SOL |
| Token Transfer (create ATA) | ~0.002 SOL (~$0.40) |
| Compute Units | Varies by program |

With Paymaster, these costs are covered — but factor them into your business model if you're sponsoring users.

---

## Summary

| Setting | Devnet | Mainnet |
|---------|--------|---------|
| RPC URL | `api.devnet.solana.com` | `api.mainnet-beta.solana.com` |
| Paymaster | `kora.devnet.lazorkit.com` | `kora.mainnet.lazorkit.com` |
| USDC Mint | `4zMMC9...` | `EPjFWdd5...` |
| Explorer | `?cluster=devnet` | (no param) |
| Cost | Free | Paid sponsorship |

---

## Need Help?

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [LazorKit Telegram](https://t.me/lazorkit)
- [Contact for Mainnet Pricing](https://lazorkit.com)

---

## Related Tutorials

- [Tutorial 1: Passkey Wallet Creation ←](01-passkey-wallet-creation.md)
- [Tutorial 2: Gasless Transactions ←](02-gasless-transactions.md)
- [Tutorial 3: Session Persistence ←](03-session-persistence.md)
