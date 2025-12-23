"use client";

import { useTypedWallet } from "@/hooks/useTypedWallet";
import { useState } from "react";

/**
 * SignMessage Component (Optional/Advanced)
 * 
 * Demonstrates message signing with passkeys.
 * Useful for authentication flows, proving wallet ownership, etc.
 * 
 * @example
 * ```tsx
 * <SignMessage />
 * ```
 */
export function SignMessage() {
    const { signMessage, isConnected } = useTypedWallet();

    const [message, setMessage] = useState("");
    const [signature, setSignature] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Signs the message with the user's passkey
     */
    const handleSign = async () => {
        if (!message.trim()) {
            setError("Please enter a message to sign");
            return;
        }

        setError(null);
        setSignature(null);
        setIsSigning(true);

        try {
            // Convert message to Uint8Array
            const messageBytes = new TextEncoder().encode(message);

            // Sign with passkey - returns { signature, signedPayload }
            const result = await signMessage(messageBytes);

            // Use the signature string directly from the result
            setSignature(result.signature);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to sign message";
            setError(errorMessage);
            console.error("Sign error:", err);
        } finally {
            setIsSigning(false);
        }
    };

    if (!isConnected) {
        return null;
    }

    return (
        <div className="sign-message">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="collapse-header"
                aria-expanded={isExpanded}
            >
                <span>✍️ Sign Message (Advanced)</span>
                <span className="collapse-icon">{isExpanded ? "−" : "+"}</span>
            </button>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="collapse-content">
                    <p className="description">
                        Sign an arbitrary message with your passkey. Useful for authentication
                        and proving wallet ownership.
                    </p>

                    {/* Message Input */}
                    <div className="form-group">
                        <label htmlFor="message-input">Message</label>
                        <textarea
                            id="message-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter message to sign..."
                            rows={3}
                            className="input textarea"
                            disabled={isSigning}
                        />
                    </div>

                    {/* Sign Button */}
                    <button
                        onClick={handleSign}
                        disabled={isSigning || !message.trim()}
                        className="btn btn-secondary btn-full"
                    >
                        {isSigning ? "Signing..." : "Sign Message"}
                    </button>

                    {/* Signature Display */}
                    {signature && (
                        <div className="signature-result">
                            <label>Signature:</label>
                            <code className="signature-value">{signature.slice(0, 32)}...</code>
                            <button
                                onClick={() => navigator.clipboard.writeText(signature)}
                                className="btn-copy"
                                title="Copy full signature"
                            >
                                📋
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="error-message" role="alert">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
