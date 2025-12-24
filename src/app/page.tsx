"use client";

import { useWallet } from "@lazorkit/wallet";
import { PublicKey } from "@solana/web3.js";
import { ConnectWallet } from "@/components/connect-wallet";
import { SendTokens } from "@/components/send-tokens";
import { SignMessage } from "@/components/sign-message";
import { useBalance } from "@/hooks/useBalance";

/**
 * LazorKit Demo - Main Page
 * 
 * Demonstrates the core features of LazorKit SDK:
 * 1. Passkey-based wallet creation
 * 2. Gasless token transfers via Paymaster
 * 3. Message signing with passkeys
 */
export default function Home() {
  const { isConnected, wallet } = useWallet();

  // Get wallet public key for balance fetching
  const walletPubkey = wallet?.smartWallet ? new PublicKey(wallet.smartWallet) : null;
  const { solBalance, usdcBalance, isLoading: balanceLoading, refresh: refreshBalance } = useBalance(walletPubkey);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🔐</span>
          <span className="logo-text">LazorKit Demo</span>
        </div>
        <nav className="nav-links">
          <a
            href="https://docs.lazorkit.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            href="https://github.com/lazor-kit/lazor-kit"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Hero Section */}
        <section className="hero">
          <h1>Passkey Smart Wallet for Solana</h1>
          <p className="tagline">
            No seed phrases. No extensions. Just your fingerprint.
          </p>

          {/* Feature badges */}
          <div className="features">
            <span className="feature-badge">🔐 Passkey Auth</span>
            <span className="feature-badge">⛽ Gasless TX</span>
            <span className="feature-badge">🏦 Smart Wallet</span>
          </div>
        </section>

        {/* Wallet Section */}
        <section className="card wallet-section">
          <ConnectWallet />
        </section>

        {/* Connected State: Show Dashboard */}
        {isConnected && wallet && (
          <>
            {/* Wallet Info Card */}
            <section className="card wallet-info-card">
              <h2>Your Smart Wallet</h2>
              <div className="wallet-address-full">
                <code>{wallet.smartWallet}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(wallet.smartWallet)}
                  className="btn-copy"
                  title="Copy address"
                >
                  📋
                </button>
              </div>

              {/* Balance Display */}
              <div className="balance-section">
                <div className="balance-row">
                  <span className="balance-label">SOL Balance:</span>
                  <span className="balance-value">
                    {balanceLoading ? (
                      <span className="skeleton-text">Loading...</span>
                    ) : solBalance !== null ? (
                      `${solBalance.toFixed(4)} SOL`
                    ) : (
                      "--"
                    )}
                  </span>
                </div>
                <div className="balance-row">
                  <span className="balance-label">USDC Balance:</span>
                  <span className="balance-value usdc">
                    {balanceLoading ? (
                      <span className="skeleton-text">Loading...</span>
                    ) : usdcBalance !== null ? (
                      `${usdcBalance.toFixed(2)} USDC`
                    ) : (
                      "--"
                    )}
                  </span>
                </div>
                <button
                  onClick={refreshBalance}
                  className="btn-refresh"
                  disabled={balanceLoading}
                  title="Refresh balances"
                >
                  🔄 {balanceLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {/* Faucet Links - Help users get test tokens */}
              <div className="faucet-links">
                <span className="faucet-label">Need test tokens?</span>
                <div className="faucet-buttons">
                  <a
                    href="https://faucet.solana.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="faucet-link"
                  >
                    🪙 Get Devnet SOL
                  </a>
                  <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="faucet-link"
                  >
                    💵 Get Devnet USDC
                  </a>
                </div>
              </div>

              <a
                href={`https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                View on Explorer →
              </a>
            </section>

            {/* Send Tokens Card - with auto-refresh callback */}
            <section className="card">
              <SendTokens onTransactionSuccess={refreshBalance} />
            </section>

            {/* Sign Message (Advanced) */}
            <section className="card">
              <SignMessage />
            </section>
          </>
        )}

        {/* Not Connected: Show Info */}
        {!isConnected && (
          <section className="info-section">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <span className="step-number">1</span>
                <h3>Connect with Passkey</h3>
                <p>Use FaceID, TouchID, or Windows Hello to create or access your wallet.</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <h3>Send Gasless Transactions</h3>
                <p>Transfer SOL or USDC without needing to hold any tokens for gas fees.</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <h3>Session Persists</h3>
                <p>Your session is saved. Come back anytime without re-authenticating.</p>
              </div>
            </div>

            {/* Getting Started Tip */}
            <div className="getting-started-tip">
              <h3>💡 First time here?</h3>
              <p>
                After connecting, you&apos;ll need Devnet tokens to test transfers.
                Use the faucet links in your wallet card to get free test tokens!
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          Built with{" "}
          <a href="https://lazorkit.com" target="_blank" rel="noopener noreferrer">
            LazorKit
          </a>
          {" "}• Deployed on Solana Devnet
        </p>
        <p className="footer-links">
          <a href="https://github.com/AJ-EN/lazorkit-passkey-gasless-demo/blob/main/docs/01-passkey-wallet-creation.md" target="_blank" rel="noopener noreferrer">Tutorial 1: Passkey</a>
          {" • "}
          <a href="https://github.com/AJ-EN/lazorkit-passkey-gasless-demo/blob/main/docs/02-gasless-transactions.md" target="_blank" rel="noopener noreferrer">Tutorial 2: Gasless TX</a>
          {" • "}
          <a href="https://github.com/AJ-EN/lazorkit-passkey-gasless-demo/blob/main/docs/03-session-persistence.md" target="_blank" rel="noopener noreferrer">Tutorial 3: Sessions</a>
          {" • "}
          <a href="https://github.com/AJ-EN/lazorkit-passkey-gasless-demo/blob/main/docs/04-deploy-to-mainnet.md" target="_blank" rel="noopener noreferrer">Tutorial 4: Mainnet</a>
        </p>
      </footer>
    </div>
  );
}
