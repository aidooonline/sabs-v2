import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square' | 'rounded';
  className?: string;
  fallbackBg?: 'primary' | 'secondary' | 'gray' | 'random';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  initials,
  size = 'md',
  shape = 'circle',
  className = '',
  fallbackBg = 'gray',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };
  
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };
  
  const fallbackBgClasses = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-white',
    gray: 'bg-gray-500 text-white',
    random: 'bg-blue-500 text-white', // Could be randomized based on initials
  };
  
  const baseClasses = 'inline-flex items-center justify-center font-medium overflow-hidden';
  
  const classes = [
    baseClasses,
    sizeClasses[size],
    shapeClasses[shape],
    className,
  ].filter(Boolean).join(' ');

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={classes}
        onError={(e) => {
          // Hide image on error and show fallback
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  const fallbackClasses = [
    classes,
    fallbackBgClasses[fallbackBg],
  ].filter(Boolean).join(' ');

  return (
    <div className={fallbackClasses}>
      {initials ? (
        <span>{initials}</span>
      ) : (
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-2/3 h-2/3">
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </div>
  );
};

export default Avatar;