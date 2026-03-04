import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 1024 1024" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background/Shadow if needed, but we'll stick to the clean shape */}
      <path 
        d="M512 128L128 896L512 704L896 896L512 128Z" 
        fill="url(#logo_gradient)"
      />
      {/* The two-tone effect from the image */}
      <path 
        d="M512 128L128 896L512 704V128Z" 
        fill="#1E00BE" 
      />
      <path 
        d="M512 128V704L896 896L512 128Z" 
        fill="#0066FF" 
      />
      <defs>
        <linearGradient id="logo_gradient" x1="128" y1="512" x2="896" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E00BE" />
          <stop offset="1" stopColor="#0066FF" />
        </linearGradient>
      </defs>
    </svg>
  );
};
