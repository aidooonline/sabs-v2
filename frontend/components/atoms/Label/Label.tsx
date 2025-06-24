import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  variant?: 'default' | 'required' | 'optional' | 'error';
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  children,
  variant = 'default',
  size = 'md',
  weight = 'medium',
  className = '',
  ...props
}) => {
  const baseClasses = 'block transition-colors duration-200';
  
  const variantClasses = {
    default: 'text-gray-700',
    required: 'text-gray-700 after:content-["*"] after:text-red-500 after:ml-1',
    optional: 'text-gray-500',
    error: 'text-red-600',
  };
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    weightClasses[weight],
    className,
  ].filter(Boolean).join(' ');

  return (
    <label className={classes} {...props}>
      {children}
    </label>
  );
};

export default Label;