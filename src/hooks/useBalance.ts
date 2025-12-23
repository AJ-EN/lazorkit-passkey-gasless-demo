/**
 * useBalance Hook
 * 
 * Fetches SOL and USDC balances for a wallet address.
 * Auto-refreshes on demand after transactions.
 * 
 * @example
 * ```tsx
 * const { solBalance, usdcBalance, isLoading, refresh } = useBalance(publicKey);
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

// Devnet USDC mint address
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const USDC_DECIMALS = 6;

// RPC endpoint from environment
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

interface BalanceState {
    solBalance: number | null;
    usdcBalance: number | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook to fetch SOL and USDC balances for a wallet
 * @param publicKey - The wallet's public key (or null if not connected)
 * @returns Balance state and refresh function
 */
export function useBalance(publicKey: PublicKey | null) {
    const [state, setState] = useState<BalanceState>({
        solBalance: null,
        usdcBalance: null,
        isLoading: false,
        error: null,
    });

    // Store publicKey string for stable dependency
    const publicKeyString = publicKey?.toBase58() ?? null;

    const fetchBalances = useCallback(async () => {
        if (!publicKeyString) {
            setState({
                solBalance: null,
                usdcBalance: null,
                isLoading: false,
                error: null,
            });
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const pk = new PublicKey(publicKeyString);
            const connection = new Connection(RPC_URL, "confirmed");

            // Fetch SOL balance
            const solLamports = await connection.getBalance(pk);
            const solBalance = solLamports / LAMPORTS_PER_SOL;

            // Fetch USDC balance
            let usdcBalance = 0;
            try {
                const usdcAta = await getAssociatedTokenAddress(USDC_MINT, pk);
                const tokenAccount = await getAccount(connection, usdcAta);
                usdcBalance = Number(tokenAccount.amount) / Math.pow(10, USDC_DECIMALS);
            } catch {
                // Token account doesn't exist = 0 balance
                usdcBalance = 0;
            }

            setState({
                solBalance,
                usdcBalance,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch balances";
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            console.error("Balance fetch error:", err);
        }
    }, [publicKeyString]);

    // Fetch on mount and when publicKey changes
    useEffect(() => {
        fetchBalances();
    }, [fetchBalances]);

    return {
        ...state,
        refresh: fetchBalances,
    };
}
