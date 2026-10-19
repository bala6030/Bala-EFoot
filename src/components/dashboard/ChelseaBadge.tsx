import React from 'react';

export interface ChelseaBadgeProps {
  size?: number;
  className?: string;
}

/**
 * Stylized Chelsea FC Emblem Badge for Bala EFoot Win Rate widget
 */
export const ChelseaBadge: React.FC<ChelseaBadgeProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Chelsea FC emblem"
    >
      <title>Chelsea FC</title>
      {/* Outer gold ring */}
      <circle cx="50" cy="50" r="48" stroke="#fbbf24" strokeWidth="3" fill="#034694" />
      
      {/* Inner ring */}
      <circle cx="50" cy="50" r="42" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.6" />
      <circle cx="50" cy="50" r="32" stroke="#fbbf24" strokeWidth="2" fill="#0a1f44" />
      
      {/* Central Lion Rampant Motif */}
      <path
        d="M44 32 C45 30, 48 30, 50 31 C52 32, 53 34, 52 36 C55 36, 57 38, 56 41 C54 41, 53 40, 52 41 C53 43, 56 46, 56 49 C54 48, 52 47, 51 49 C50 51, 52 54, 53 58 C51 57, 49 55, 48 57 C47 60, 48 64, 49 68 C46 66, 45 63, 44 65 C43 68, 44 72, 45 75 C42 74, 40 70, 39 67 C38 64, 39 60, 40 56 C37 57, 36 60, 35 63 C34 59, 36 55, 38 52 C37 50, 35 50, 34 51 C35 48, 38 46, 40 46 C41 43, 41 39, 43 35 Z"
        fill="#ffffff"
      />
      {/* Staff held by Lion */}
      <path
        d="M54 30 L55 72"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Staff cross top */}
      <path
        d="M51 33 L58 33"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Football rosettes */}
      <circle cx="26" cy="50" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx="74" cy="50" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};
