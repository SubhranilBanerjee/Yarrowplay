import React from 'react';

interface CoinIconProps {
  className?: string;
  size?: number;
}

export function CoinIcon({ className = 'w-4 h-4 inline-block', size }: CoinIconProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      className={`shrink-0 align-middle inline-block ${className}`}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Coin icon"
    >
      <circle cx="12" cy="12" r="10" fill="url(#lr_coin_grad)" stroke="#D9A028" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#FFE97A" strokeWidth="1" opacity="0.7" />
      <path
        d="M12 6.5V17.5M9.5 9H14M9.5 15H14"
        stroke="#5C3B00"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="lr_coin_grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFDF00" />
          <stop offset="0.5" stopColor="#F4C95D" />
          <stop offset="1" stopColor="#D99B00" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default CoinIcon;
