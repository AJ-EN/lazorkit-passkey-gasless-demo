"use client";

import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire app.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <span className="error-boundary-icon">⚠️</span>
                        <h2>Something went wrong</h2>
                        <p className="error-boundary-message">
                            An unexpected error occurred. Please try again.
                        </p>
                        {this.state.error && (
                            <details className="error-boundary-details">
                                <summary>Error details</summary>
                                <code>{this.state.error.message}</code>
                            </details>
                        )}
                        <button
                            onClick={this.handleRetry}
                            className="btn btn-primary"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
