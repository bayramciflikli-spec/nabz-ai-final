"use client";

export function LoadingPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ minHeight: "1.25rem" }}
    >
      <svg
        viewBox="0 0 115 24"
        className="w-36 h-8"
        fill="none"
      >
        <defs>
          <linearGradient id="loading-pulse-grad-nabz" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <path
          d="M0,12 L30,12 L35,2 L40,22 L45,6 L50,18 L55,12 L85,12"
          stroke="url(#loading-pulse-grad-nabz)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="loading-pulse-line"
          style={{ filter: "drop-shadow(0 0 6px rgba(239,68,68,0.6))" }}
        />
      </svg>
    </div>
  );
}
