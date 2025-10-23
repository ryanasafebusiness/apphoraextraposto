import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-black p-2 rounded-lg shadow-sm">
        <div className={`text-white font-bold ${sizeClasses[size]}`}>
          <div className="text-xs text-white mb-0.5">REDE</div>
          <div className="text-red-500 font-black text-xl">JB</div>
        </div>
      </div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
          JBRETAS HREXTRA
        </span>
      )}
    </div>
  );
}
