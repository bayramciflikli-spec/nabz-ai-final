"use client";

import { Component, ReactNode } from "react";
import { ErrorFallback } from "./ErrorBoundaryFallback";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: Error) {
    console.error("[ErrorBoundary] caught:", err?.message, err?.stack, err);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
            <div className="text-center">
              <h1 className="text-xl font-bold mb-4">Bir hata oluştu</h1>
              <p className="text-gray-400 mb-6">
                Tekrar dene veya ana sayfaya dön.
              </p>
              <ErrorFallback />
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
