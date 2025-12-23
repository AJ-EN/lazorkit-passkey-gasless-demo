# LazorKit Demo

A starter template demonstrating **passkey authentication** and **gasless transactions** on Solana using the [LazorKit SDK](https://lazorkit.com).

> 🔐 No seed phrases. No browser extensions. Just your fingerprint.

---

## ✨ Features

- **Passkey Authentication** — Create and access wallets using FaceID, TouchID, or Windows Hello
- **Gasless Transactions** — Send SOL and USDC without needing native tokens for gas fees
- **SPL Token Support** — Full USDC transfer support with automatic ATA creation
- **Smart Wallet** — Programmable account abstraction via PDAs
- **Session Persistence** — Stay connected across page refreshes

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/lazorkit-demo.git
cd lazorkit-demo
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

### 4. Connect with Passkey

Click **"Connect with Passkey"** and follow your device's biometric prompt.

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `@lazorkit/wallet` | Core SDK — Provider, hooks, and Paymaster integration |
| `@coral-xyz/anchor` | Peer dependency for Solana program interactions |
| `@solana/web3.js` | Solana transactions and PublicKey utilities |
| `buffer` | Polyfill for Next.js browser compatibility |
| `zustand` | State management (peer dependency) |

---

## 📁 Project Structure

```
lazorkit-demo/
├── src/
│   ├── app/
│   │   ├── providers.tsx    # LazorkitProvider setup + Buffer polyfill
│   │   ├── layout.tsx       # Root layout with Providers wrapper
│   │   ├── page.tsx         # Main demo page
│   │   └── globals.css      # Minimal Solana-themed styling
│   └── components/
│       ├── connect-wallet.tsx   # Passkey wallet connect/disconnect
│       ├── send-tokens.tsx      # SOL transfer with gasless TX
│       └── sign-message.tsx     # Message signing (advanced)
├── docs/
│   ├── 01-passkey-wallet-creation.md   # Tutorial 1
│   ├── 02-gasless-transactions.md      # Tutorial 2
│   └── 03-session-persistence.md       # Tutorial 3
├── README.md
└── package.json
```

---

## 🔧 Configuration

The SDK uses environment variables for configuration. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_RPC` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_LAZORKIT_PORTAL` | LazorKit passkey portal | `https://portal.lazor.sh` |
| `NEXT_PUBLIC_LAZORKIT_PAYMASTER` | Kora paymaster URL | `https://kora.devnet.lazorkit.com` |

### Switching to Mainnet

Update your `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_LAZORKIT_PAYMASTER=https://kora.mainnet.lazorkit.com
```

---

## 📚 Tutorials

Step-by-step guides to understanding the implementation:

1. **[Passkey Wallet Creation](docs/01-passkey-wallet-creation.md)** — How WebAuthn passkeys replace seed phrases
2. **[Gasless Transactions](docs/02-gasless-transactions.md)** — How the Paymaster covers gas fees
3. **[Session Persistence](docs/03-session-persistence.md)** — How sessions work across refreshes and devices

---

## 🧪 Testing

### Airdrop Devnet SOL

Your smart wallet needs SOL to receive transfers. Request Devnet SOL:

```bash
solana airdrop 1 YOUR_SMART_WALLET_ADDRESS --url devnet
```

Or use the [Solana Faucet](https://faucet.solana.com/).

### Manual Testing Checklist

- [ ] Create new passkey wallet (first-time user)
- [ ] Restore session on page refresh
- [ ] Send 0.001 SOL to another address
- [ ] Send USDC to another address (requires Devnet USDC)
- [ ] View transaction on Solana Explorer
- [ ] Sign an arbitrary message

---

## 🌐 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/lazorkit-demo)

### Manual Deployment

```bash
npm run build
npm run start
```

---

## 🔧 Troubleshooting

### "Passkey creation failed"

**Solution:** Ensure your device has biometrics enabled (TouchID, FaceID, or Windows Hello). Passkeys require a secure context — use `https://` or `localhost`.

### "Transaction failed" when sending USDC

**Solution:** Make sure your smart wallet has Devnet USDC. You can get test USDC from the [Circle Devnet Faucet](https://faucet.circle.com/) or swap Devnet SOL for USDC on a DEX.

### Buffer is not defined

**Solution:** The app includes a Buffer polyfill in `providers.tsx`. If you see this error, ensure you're importing the providers correctly in your layout.

### Wallet not connecting on mobile

**Solution:** Some mobile browsers have limited WebAuthn support. Try using Safari on iOS or Chrome on Android.

---

## 🔗 Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [LazorKit GitHub](https://github.com/lazor-kit/lazor-kit)
- [LazorKit Telegram](https://t.me/lazorkit)
- [Solana Developer Docs](https://solana.com/docs)

---

## 📄 License

MIT License — feel free to use this template for your own projects!

---

## 🙏 Acknowledgments

Built with [LazorKit](https://lazorkit.com) — the open-source passkey wallet infrastructure for Solana.
