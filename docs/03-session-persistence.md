# Tutorial 3: Session Persistence Across Devices

This tutorial explains how LazorKit handles session persistence, auto-reconnection, and multi-device passkey sync.

---

## How Sessions Work

When a user connects with a passkey, LazorKit stores session data locally:

```
┌─────────────────────────────────────────┐
│  Browser LocalStorage                    │
│  ─────────────────────────────────────  │
│  lazorkit:session → {                   │
│    smartWallet: "7xKXtg...",           │
│    credentialId: "abc123...",          │
│    lastConnected: 1703123456           │
│  }                                      │
└─────────────────────────────────────────┘
```

This allows:
1. **Instant reconnection** — No popup on page refresh
2. **Persistent wallet address** — Same address every time
3. **Automatic restoration** — `useWallet` hook handles it

---

## Auto-Reconnect on Page Load

LazorKit automatically attempts to restore the session when the app loads:

```tsx
import { useWallet } from "@lazorkit/wallet";

function App() {
  const { isConnected, wallet, isConnecting } = useWallet();

  // On first render, LazorKit checks for existing session
  // If found, isConnected becomes true automatically
  
  if (isConnecting) {
    return <div>Restoring session...</div>;
  }

  if (isConnected) {
    return <div>Welcome back, {wallet.smartWallet.slice(0, 8)}!</div>;
  }

  return <ConnectButton />;
}
```

**Key behavior:**
- First visit: `isConnected = false`, user must click "Connect"
- Return visit: `isConnected = true` (if session exists)
- No passkey popup needed for restoration

---

## How `connect()` Handles Sessions

When you call `connect()`, LazorKit follows this flow:

```
connect() called
      │
      ▼
┌─────────────────────┐
│ Check LocalStorage  │
│ for existing session│
└─────────────────────┘
      │
      ├── Session found ──────┐
      │                       ▼
      │              ┌─────────────────────┐
      │              │ Verify credential   │
      │              │ with server         │
      │              └─────────────────────┘
      │                       │
      │                       ▼
      │              ┌─────────────────────┐
      │              │ Restore session     │
      │              │ (No popup!)         │
      │              └─────────────────────┘
      │
      └── No session ─────────┐
                              ▼
                     ┌─────────────────────┐
                     │ Open passkey portal │
                     │ (User creates new)  │
                     └─────────────────────┘
```

---

## Clearing Sessions

To log out and clear the session:

```tsx
const { disconnect } = useWallet();

const handleLogout = async () => {
  await disconnect();
  // Session is cleared from LocalStorage
  // isConnected becomes false
};
```

This removes:
- Local session data
- Any cached credentials

It does **not** delete:
- The passkey from the device
- The smart wallet on Solana

The user can reconnect anytime using the same passkey.

---

## Multi-Device Passkey Sync

Passkeys can sync across devices via platform-specific mechanisms:

### Apple Devices (iCloud Keychain)

If using Safari or Chrome on Apple devices with iCloud Keychain enabled:
- Passkey created on iPhone → Available on Mac
- Passkey created on Mac → Available on iPad

### Android (Google Password Manager)

Passkeys sync via Google account:
- Passkey created on Pixel → Available on Galaxy
- Requires same Google account

### Windows (Microsoft Account)

Windows Hello passkeys can sync via Microsoft account (limited).

### Cross-Platform Considerations

```
┌─────────────────────────────────────────────────────────┐
│                    Same Passkey                         │
├─────────────────────────────────────────────────────────┤
│    iPhone    ──────────────────────────▶     Mac       │
│     (via iCloud Keychain)                              │
├─────────────────────────────────────────────────────────┤
│    Pixel     ──────────────────────────▶    Galaxy     │
│     (via Google Password Manager)                      │
├─────────────────────────────────────────────────────────┤
│    iPhone    ─────────X──────────────▶    Android      │
│     (No cross-platform sync)                           │
└─────────────────────────────────────────────────────────┘
```

**Important:** Passkeys don't sync between Apple and Android ecosystems. Users on both platforms will create separate passkeys for the same wallet.

---

## Session Recovery Scenarios

### Scenario 1: Same Device, Same Browser

✅ **Automatic** — Session restored from LocalStorage

### Scenario 2: Same Device, Different Browser

🔐 **Passkey prompt** — Session not shared between browsers, but same passkey works

### Scenario 3: New Device, Same Ecosystem

🔐 **Passkey prompt** — Synced passkey used, no new credential needed

### Scenario 4: New Device, Different Ecosystem

🆕 **New passkey created** — But same smart wallet address is restored

---

## Implementing Session Status UI

Show appropriate feedback based on session state:

```tsx
"use client";

import { useWallet } from "@lazorkit/wallet";

export function SessionStatus() {
  const { isConnected, isConnecting, wallet } = useWallet();

  if (isConnecting) {
    return (
      <div className="session-checking">
        <span className="spinner" />
        Checking session...
      </div>
    );
  }

  if (isConnected && wallet) {
    return (
      <div className="session-active">
        <span className="status-dot green" />
        Connected: {wallet.smartWallet.slice(0, 8)}...
      </div>
    );
  }

  return (
    <div className="session-none">
      <span className="status-dot gray" />
      Not connected
    </div>
  );
}
```

---

## Best Practices

### 1. Don't Force Immediate Connection

Let users explore before requiring authentication:

```tsx
// ❌ Bad: Force connect on load
useEffect(() => {
  connect();
}, []);

// ✅ Good: Show connect button, let user decide
return isConnected ? <Dashboard /> : <LandingPage />;
```

### 2. Handle Loading States

Always show something while checking session:

```tsx
if (isConnecting) {
  return <Skeleton />; // Not a blank screen
}
```

### 3. Persist Non-Sensitive Data

You can store preferences alongside the session:

```tsx
// Safe to store in localStorage
localStorage.setItem("user_theme", "dark");
localStorage.setItem("last_recipient", "7xKXt...");

// NEVER store
localStorage.setItem("private_key", "..."); // ← LazorKit doesn't do this!
```

### 4. Clear Stale Sessions

If your app version changes significantly:

```tsx
const APP_VERSION = "1.0.0";

useEffect(() => {
  const storedVersion = localStorage.getItem("app_version");
  if (storedVersion !== APP_VERSION) {
    disconnect(); // Clear old session
    localStorage.setItem("app_version", APP_VERSION);
  }
}, []);
```

---

## Troubleshooting

### "Session expired" errors

**Cause:** Server-side session validation failed.

**Solution:** Call `disconnect()` then `connect()` again to refresh.

### Wallet address changed unexpectedly

**Cause:** User created a new passkey instead of using existing one.

**Solution:** This is a new wallet. The user may need to use their original passkey to access their funds.

### Can't restore session on mobile

**Cause:** Mobile browsers may clear LocalStorage more aggressively.

**Solution:** Prompt user to "Add to Home Screen" for more persistent storage.

---

## Summary

| Feature | Behavior |
|---------|----------|
| Page refresh | Session auto-restored, no popup |
| Browser close/reopen | Session auto-restored |
| Clear browser data | Session lost, passkey still works |
| New device (same ecosystem) | Passkey syncs, new session created |
| New device (different ecosystem) | New passkey, same wallet address |

---

## Related Tutorials

- [Tutorial 1: Passkey Wallet Creation ←](01-passkey-wallet-creation.md)
- [Tutorial 2: Gasless Transactions ←](02-gasless-transactions.md)
