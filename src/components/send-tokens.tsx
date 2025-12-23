"use client";

import { useTypedWallet } from "@/hooks/useTypedWallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js";
import {
    getAssociatedTokenAddress,
    createTransferInstruction,
    createAssociatedTokenAccountIdempotentInstruction
} from "@solana/spl-token";
import { useState, useCallback } from "react";

// Devnet USDC Mint Address
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
// USDC has 6 decimals
const USDC_DECIMALS = 6;

type TokenType = "SOL" | "USDC";
type TransactionStatus = "idle" | "pending" | "success" | "error";

/**
 * SendTokens Component
 * 
 * Unified token transfer component supporting both SOL and USDC.
 * Uses LazorKit's Paymaster for gasless transactions.
 * 
 * Features:
 * - Token selector (SOL/USDC)
 * - Amount and recipient inputs
 * - Gasless transaction via Paymaster
 * - Transaction status with Explorer link
 * 
 * @example
 * ```tsx
 * <SendTokens />
 * ```
 */
export function SendTokens() {
    const { signAndSendTransaction, smartWalletPubkey, isConnected } = useTypedWallet();

    // Form state
    const [token, setToken] = useState<TokenType>("SOL");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");

    // Transaction state
    const [status, setStatus] = useState<TransactionStatus>("idle");
    const [signature, setSignature] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Validates a Solana address
     */
    const isValidAddress = useCallback((address: string): boolean => {
        try {
            new PublicKey(address);
            return true;
        } catch {
            return false;
        }
    }, []);

    /**
     * Handles the token transfer
     * 
     * Flow:
     * 1. Validate inputs
     * 2. Create transfer instruction
     * 3. Sign with passkey via signAndSendTransaction
     * 4. Transaction is submitted via Paymaster (gasless)
     */
    const handleSend = async () => {
        // Reset state
        setError(null);
        setSignature(null);

        // Validation
        if (!smartWalletPubkey) {
            setError("Wallet not connected");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        if (!recipient || !isValidAddress(recipient)) {
            setError("Please enter a valid Solana address");
            return;
        }

        setStatus("pending");

        try {
            if (token === "SOL") {
                // SOL Transfer
                const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

                const instruction = SystemProgram.transfer({
                    fromPubkey: smartWalletPubkey,
                    toPubkey: new PublicKey(recipient),
                    lamports: Math.floor(lamports),
                });

                // Sign and send via Paymaster (gasless)
                const txSignature = await signAndSendTransaction({
                    instructions: [instruction],
                });

                setSignature(txSignature);
                setStatus("success");

                // Reset form on success
                setAmount("");
                setRecipient("");

            } else {
                // USDC Transfer using SPL Token program
                const recipientPubkey = new PublicKey(recipient);

                // Get the sender's Associated Token Account (ATA)
                const sourceAccount = await getAssociatedTokenAddress(
                    USDC_MINT,
                    smartWalletPubkey
                );

                // Get the recipient's Associated Token Account (ATA)
                const destinationAccount = await getAssociatedTokenAddress(
                    USDC_MINT,
                    recipientPubkey
                );

                // Create instructions array
                const instructions: TransactionInstruction[] = [];

                // Create destination ATA if it doesn't exist (idempotent - safe to call even if exists)
                const createAtaInstruction = createAssociatedTokenAccountIdempotentInstruction(
                    smartWalletPubkey, // payer (will be paid by paymaster)
                    destinationAccount, // ata
                    recipientPubkey, // owner
                    USDC_MINT // mint
                );
                instructions.push(createAtaInstruction);

                // Convert amount to USDC base units (6 decimals)
                const amountBigInt = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, USDC_DECIMALS)));

                // Create the transfer instruction
                const transferInstruction = createTransferInstruction(
                    sourceAccount,
                    destinationAccount,
                    smartWalletPubkey,
                    amountBigInt
                );
                instructions.push(transferInstruction);

                // Sign and send via Paymaster (gasless)
                const txSignature = await signAndSendTransaction({
                    instructions,
                });

                setSignature(txSignature);
                setStatus("success");

                // Reset form on success
                setAmount("");
                setRecipient("");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Transaction failed";
            setError(errorMessage);
            setStatus("error");
            console.error("Transaction error:", err);
        }
    };

    // Don't render if not connected
    if (!isConnected) {
        return null;
    }

    const explorerUrl = signature
        ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
        : null;

    return (
        <div className="send-tokens">
            <h2>Send Tokens</h2>

            {/* Token Selector */}
            <div className="form-group">
                <label htmlFor="token-select">Token</label>
                <select
                    id="token-select"
                    value={token}
                    onChange={(e) => setToken(e.target.value as TokenType)}
                    className="input"
                    disabled={status === "pending"}
                >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC (Devnet)</option>
                </select>
            </div>

            {/* Amount Input */}
            <div className="form-group">
                <label htmlFor="amount-input">Amount</label>
                <input
                    id="amount-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.001"
                    min="0"
                    step="0.001"
                    className="input"
                    disabled={status === "pending"}
                />
            </div>

            {/* Recipient Input */}
            <div className="form-group">
                <label htmlFor="recipient-input">Recipient Address</label>
                <input
                    id="recipient-input"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Solana address..."
                    className="input"
                    disabled={status === "pending"}
                />
            </div>

            {/* Send Button */}
            <button
                onClick={handleSend}
                disabled={status === "pending" || !amount || !recipient}
                className="btn btn-primary btn-full"
            >
                {status === "pending" ? (
                    <>
                        <span className="spinner" aria-hidden="true" />
                        Sending...
                    </>
                ) : (
                    `Send ${token}`
                )}
            </button>

            {/* Gasless Badge */}
            <p className="gasless-badge">
                ⛽ Gasless transaction powered by LazorKit Paymaster
            </p>

            {/* Status Messages */}
            {status === "success" && signature && (
                <div className="success-message">
                    <p>✅ Transaction confirmed!</p>
                    <a
                        href={explorerUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explorer-link"
                    >
                        View on Solana Explorer →
                    </a>
                </div>
            )}

            {error && (
                <p className="error-message" role="alert">
                    ❌ {error}
                </p>
            )}
        </div>
    );
}
