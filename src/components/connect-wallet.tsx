"use client";

import { useWallet } from "@lazorkit/wallet";
import { useState } from "react";

/**
 * ConnectWallet Component
 * 
 * Handles passkey-based wallet authentication using LazorKit SDK.
 * 
 * Features:
 * - Create new passkey wallet (first-time users)
 * - Restore existing wallet session
 * - One-click disconnect
 * 
 * @example
 * ```tsx
 * <ConnectWallet />
 * ```
 */
export function ConnectWallet() {
    const { connect, disconnect, isConnected, isConnecting, wallet } = useWallet();
    const [error, setError] = useState<string | null>(null);

    /**
     * Initiates passkey authentication flow
     * 
     * This will:
     * 1. Check for existing passkey credentials
     * 2. If found, restore session automatically
     * 3. If not found, prompt user to create new passkey
     */
    const handleConnect = async () => {
        setError(null);
        try {
            await connect();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
            setError(errorMessage);
            console.error("Connection error:", err);
        }
    };

    /**
     * Clears the current session
     */
    const handleDisconnect = async () => {
        setError(null);
        try {
            await disconnect();
        } catch (err) {
            console.error("Disconnect error:", err);
        }
    };

    // Connected state: Show wallet address and disconnect button
    if (isConnected && wallet) {
        const shortAddress = `${wallet.smartWallet.slice(0, 6)}...${wallet.smartWallet.slice(-4)}`;

        return (
            <div className="connect-wallet connected">
                <div className="wallet-info">
                    <span className="wallet-label">Smart Wallet</span>
                    <code className="wallet-address" title={wallet.smartWallet}>
                        {shortAddress}
                    </code>
                </div>
                <button
                    onClick={handleDisconnect}
                    className="btn btn-secondary"
                    aria-label="Disconnect wallet"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    // Disconnected state: Show connect button
    return (
        <div className="connect-wallet">
            <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn btn-primary"
                aria-label={isConnecting ? "Connecting..." : "Connect with Passkey"}
            >
                {isConnecting ? (
                    <>
                        <span className="spinner" aria-hidden="true" />
                        Connecting...
                    </>
                ) : (
                    <>
                        <span className="passkey-icon" aria-hidden="true">🔐</span>
                        Connect with Passkey
                    </>
                )}
            </button>

            {error && (
                <p className="error-message" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
