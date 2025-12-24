/**
 * Type-safe wrapper for LazorKit wallet hook
 * 
 * The LazorKit SDK's TypeScript definitions are incomplete at runtime.
 * This wrapper provides properly typed versions of the wallet methods
 * based on the official documentation.
 * 
 * @see https://docs.lazorkit.com/react-sdk/use-wallet
 */

import { useWallet as useLazorKitWallet } from "@lazorkit/wallet";
import { TransactionInstruction, AddressLookupTableAccount, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";

/**
 * Payload for signAndSendTransaction
 * @see https://docs.lazorkit.com/react-sdk/types#signandsendtransactionpayload
 */
export interface SignAndSendTransactionPayload {
    instructions: TransactionInstruction[];
    transactionOptions?: {
        feeToken?: string;
        addressLookupTableAccounts?: AddressLookupTableAccount[];
        computeUnitLimit?: number;
        clusterSimulation?: 'devnet' | 'mainnet';
    };
}

/**
 * Return type for signMessage
 * @see https://docs.lazorkit.com/react-sdk/use-wallet#signmessage
 */
export interface SignMessageResult {
    signature: string;
    signedPayload: string;
}

/**
 * Typed wallet interface based on LazorKit documentation
 */
export interface TypedWalletHook {
    // From existing SDK types
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    isConnected: boolean;
    isConnecting: boolean;
    wallet: {
        credentialId: string;
        passkeyPubkey: number[];
        smartWallet: string;
        walletDevice: string;
        platform: string;
        accountName?: string;
    } | null;
    smartWalletPubkey: PublicKey | null;

    // Methods with corrected types (exist at runtime but types are incomplete)
    signMessage: (message: Uint8Array) => Promise<SignMessageResult>;
    signAndSendTransaction: (payload: SignAndSendTransactionPayload) => Promise<string>;
}

/**
 * Type-safe wrapper around LazorKit's useWallet hook
 * 
 * Use this instead of importing useWallet directly from @lazorkit/wallet
 * to get proper TypeScript types for all methods.
 * 
 * @example
 * ```tsx
 * import { useTypedWallet } from "@/hooks/useTypedWallet";
 * 
 * function MyComponent() {
 *   const { signAndSendTransaction, smartWalletPubkey } = useTypedWallet();
 *   // ...
 * }
 * ```
 */
export function useTypedWallet(): TypedWalletHook {
    // The SDK's hook has all the methods at runtime, but TypeScript types are incomplete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walletHook = useLazorKitWallet() as any;

    // Extract values before useMemo to help React Compiler understand dependencies
    const sdkSmartWalletPubkey = walletHook.smartWalletPubkey;
    const smartWalletAddress = walletHook.wallet?.smartWallet;

    // Derive smartWalletPubkey from wallet.smartWallet if the SDK doesn't provide it directly
    const smartWalletPubkey = useMemo(() => {
        // First check if SDK provides it directly
        if (sdkSmartWalletPubkey) {
            return sdkSmartWalletPubkey;
        }
        // Otherwise derive from wallet.smartWallet string
        if (smartWalletAddress) {
            try {
                return new PublicKey(smartWalletAddress);
            } catch (e) {
                console.error('[useTypedWallet] Failed to parse smartWallet:', e);
                return null;
            }
        }
        return null;
    }, [sdkSmartWalletPubkey, smartWalletAddress]);

    return {
        ...walletHook,
        smartWalletPubkey,
    };
}

