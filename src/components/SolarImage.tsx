import React, { useState } from 'react';
import { Sun } from 'lucide-react';

interface SolarImageProps {
  src: string;
  alt: string;
  fallbackLabel?: string;
  className?: string;
}

export function SolarImage({ src, alt, fallbackLabel, className = '' }: SolarImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sun className="w-8 h-8 text-slate-400 mb-2" />
        <span className="text-xs font-medium text-slate-600 line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
