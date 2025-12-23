"use client";

import { LazorkitProvider } from "@lazorkit/wallet";
import { ReactNode } from "react";

// Polyfill Buffer for Next.js (required by Solana libraries)
if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    window.Buffer = window.Buffer || require("buffer").Buffer;
}

/**
 * LazorKit SDK Configuration
 * 
 * Configuration is read from environment variables for flexibility.
 * Copy .env.example to .env.local to customize these values.
 * 
 * - rpcUrl: Solana Devnet RPC endpoint
 * - portalUrl: LazorKit's passkey authentication portal
 * - paymasterConfig: Kora paymaster for gasless transactions
 */
const LAZORKIT_CONFIG = {
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
    portalUrl: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL || "https://portal.lazor.sh",
    paymasterConfig: {
        paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER || "https://kora.devnet.lazorkit.com",
    },
};

interface ProvidersProps {
    children: ReactNode;
}

/**
 * Root providers wrapper for LazorKit SDK
 * 
 * This component:
 * 1. Polyfills Buffer for browser compatibility
 * 2. Wraps the app with LazorkitProvider for passkey + gasless transactions
 * 
 * @example
 * ```tsx
 * <Providers>
 *   <App />
 * </Providers>
 * ```
 */
export function Providers({ children }: ProvidersProps) {
    return (
        <LazorkitProvider
            rpcUrl={LAZORKIT_CONFIG.rpcUrl}
            portalUrl={LAZORKIT_CONFIG.portalUrl}
            paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
        >
            {children}
        </LazorkitProvider>
    );
}
