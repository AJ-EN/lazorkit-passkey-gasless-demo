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

interface TransactionRecord {
    signature: string;
    token: TokenType;
    amount: string;
    timestamp: number;
}

interface SendTokensProps {
    /** Callback fired after a successful transaction (e.g., to refresh balances) */
    onTransactionSuccess?: () => void;
}

/**
 * SendTokens Component
 * 
 * Unified token transfer component supporting both SOL and USDC.
 * Uses LazorKit's Paymaster for gasless transactions.
 * 
 * Features:
 * - Token selector (SOL/USDC)
 * - Fee token selector (pay gas in SOL or USDC)
 * - Amount and recipient inputs
 * - Gasless transaction via Paymaster
 * - Transaction history (last 5 TXs)
 * - Auto-refresh callback after success
 * 
 * @example
 * ```tsx
 * <SendTokens onTransactionSuccess={() => refreshBalance()} />
 * ```
 */
export function SendTokens({ onTransactionSuccess }: SendTokensProps) {
    const { signAndSendTransaction, isConnected, smartWalletPubkey } = useTypedWallet();

    // Form state
    const [token, setToken] = useState<TokenType>("SOL");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");

    // Transaction state
    const [status, setStatus] = useState<TransactionStatus>("idle");
    const [signature, setSignature] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Transaction history (persists during session)
    const [txHistory, setTxHistory] = useState<TransactionRecord[]>([]);

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
     * Adds a transaction to history
     */
    const addToHistory = useCallback((sig: string, tokenType: TokenType, amt: string) => {
        setTxHistory(prev => [
            { signature: sig, token: tokenType, amount: amt, timestamp: Date.now() },
            ...prev.slice(0, 4) // Keep last 5
        ]);
    }, []);

    /**
     * Handles the token transfer
     * 
     * Flow:
     * 1. Validate inputs
     * 2. Create transfer instruction
     * 3. Sign with passkey via signAndSendTransaction
     * 4. Transaction is submitted via Paymaster (gasless)
     * 5. Call onTransactionSuccess callback to refresh balances
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
            let txSignature: string;

            if (token === "SOL") {
                // SOL Transfer
                const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

                const instruction = SystemProgram.transfer({
                    fromPubkey: smartWalletPubkey,
                    toPubkey: new PublicKey(recipient),
                    lamports: Math.floor(lamports),
                });

                // Debug: Log instruction data to diagnose undefined values
                console.log('[SendTokens] SOL Transfer Debug:', {
                    smartWalletPubkey: smartWalletPubkey?.toBase58(),
                    recipient,
                    lamports: Math.floor(lamports),
                    instruction: {
                        programId: instruction.programId?.toBase58(),
                        keys: instruction.keys?.map(k => ({
                            pubkey: k.pubkey?.toBase58(),
                            isSigner: k.isSigner,
                            isWritable: k.isWritable
                        })),
                        dataLength: instruction.data?.length
                    }
                });

                // Sign and send via Paymaster (gasless)
                txSignature = await signAndSendTransaction({
                    instructions: [instruction],
                });

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
                txSignature = await signAndSendTransaction({
                    instructions,
                });
            }

            setSignature(txSignature);
            setStatus("success");

            // Add to transaction history
            addToHistory(txSignature, token, amount);

            // Reset form on success
            setAmount("");
            setRecipient("");

            // Notify parent to refresh balances
            if (onTransactionSuccess) {
                // Small delay to ensure transaction is confirmed
                setTimeout(() => {
                    onTransactionSuccess();
                }, 1000);
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
                <label htmlFor="token-select">Token to Send</label>
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

            {/* Note: Fee token selection (pay gas in USDC) requires Mainnet Paymaster */}

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

            {/* Transaction History */}
            {txHistory.length > 0 && (
                <div className="tx-history">
                    <h3>Recent Transactions</h3>
                    <ul className="tx-list">
                        {txHistory.map((tx) => (
                            <li key={tx.signature} className="tx-item">
                                <span className="tx-info">
                                    {tx.amount} {tx.token}
                                </span>
                                <a
                                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-link"
                                    title={tx.signature}
                                >
                                    {tx.signature.slice(0, 8)}...
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
