import React from 'react';

export const CornerFiligree: React.FC<{ className?: string }> = ({ className = '' }) => (
  <>
    {/* Top-Left Corner Bracket & Rivet */}
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 left-0 w-6 h-6 text-[#b88948] opacity-75 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M2 18V4C2 2.9 2.9 2 4 2H18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 12V5H12" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
    </svg>
    {/* Top-Right Corner Bracket & Rivet */}
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 right-0 w-6 h-6 text-[#b88948] opacity-75 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M22 18V4C22 2.9 21.1 2 20 2H6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19 12V5H12" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      <circle cx="19" cy="5" r="1.5" fill="currentColor" />
    </svg>
    {/* Bottom-Left Corner Bracket & Rivet */}
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 left-0 w-6 h-6 text-[#b88948] opacity-75 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M2 6V20C2 21.1 2.9 22 4 22H18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 12V19H12" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
    </svg>
    {/* Bottom-Right Corner Bracket & Rivet */}
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 right-0 w-6 h-6 text-[#b88948] opacity-75 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M22 6V20C22 21.1 21.1 22 20 22H6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19 12V19H12" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      <circle cx="19" cy="19" r="1.5" fill="currentColor" />
    </svg>
  </>
);
