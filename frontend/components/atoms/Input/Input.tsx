import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, generateId } from '../../../utils/helpers';

// Input variants using class-variance-authority
const inputVariants = cva(
  // Base styles
  'flex w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50',
        warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500 bg-yellow-50',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

// Helper text variants
const helperTextVariants = cva('mt-1 text-xs', {
  variants: {
    state: {
      default: 'text-gray-500',
      error: 'text-red-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  warningMessage?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  required?: boolean;
  showRequiredIndicator?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      state,
      label,
      helperText,
      errorMessage,
      successMessage,
      warningMessage,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      id,
      required,
      showRequiredIndicator = true,
      fullWidth = true,
      type = 'text',
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputId = id || generateId('input');
    const helperTextId = `${inputId}-helper-text`;
    const errorTextId = `${inputId}-error-text`;
    
    // Determine the current state based on messages
    const currentState = errorMessage 
      ? 'error' 
      : successMessage 
      ? 'success'
      : warningMessage
      ? 'warning'
      : state || 'default';
    
    // Determine which message to display (priority: error > warning > success > helper)
    const displayMessage = errorMessage || warningMessage || successMessage || helperText;
    const messageId = errorMessage 
      ? errorTextId 
      : warningMessage || successMessage || helperText
      ? helperTextId
      : undefined;

    // Build aria-describedby
    const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ');

    return (
      <div className={cn('w-full', !fullWidth && 'w-auto')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && showRequiredIndicator && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}
          
          {/* Left Element (interactive) */}
          {leftElement && (
            <div className="absolute inset-y-0 left-0 flex items-center">
              {leftElement}
            </div>
          )}
          
          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              inputVariants({ size, state: currentState }),
              leftIcon && 'pl-10',
              leftElement && 'pl-12',
              rightIcon && 'pr-10',
              rightElement && 'pr-12',
              className
            )}
            aria-invalid={currentState === 'error'}
            aria-describedby={describedBy || undefined}
            required={required}
            {...props}
          />
          
          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
          
          {/* Right Element (interactive) */}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        
        {/* Helper/Error Text */}
        {displayMessage && (
          <p
            id={messageId}
            className={helperTextVariants({ state: currentState })}
            role={errorMessage ? 'alert' : 'status'}
            aria-live={errorMessage ? 'assertive' : 'polite'}
          >
            {displayMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;