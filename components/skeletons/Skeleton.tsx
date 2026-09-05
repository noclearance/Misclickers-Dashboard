import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  style,
  variant = 'rounded',
}) => {
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'rounded'
      ? 'rounded-xl'
      : 'rounded-none';

  return (
    <div
      style={style}
      className={`skeleton-shimmer bg-osrs-dark/70 border border-osrs-gold/5 ${variantClass} ${className}`}
      aria-hidden="true"
    />
  );
};
