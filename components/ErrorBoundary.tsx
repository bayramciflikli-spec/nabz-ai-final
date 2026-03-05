"use client";

import { Component, ReactNode } from "react";

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

  componentDidCatch() {
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
                Sayfayı yenileyerek tekrar deneyin.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Yenile
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
