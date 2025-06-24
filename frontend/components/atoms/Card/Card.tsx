import React, { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/helpers';

// Card variants using class-variance-authority
const cardVariants = cva(
  // Base styles
  'rounded-lg transition-all duration-200 focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-white border border-gray-200 shadow-sm',
        outlined: 'bg-white border-2 border-gray-300',
        elevated: 'bg-white shadow-md border border-gray-100',
        filled: 'bg-gray-50 border border-gray-200',
        ghost: 'bg-transparent',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        false: '',
      },
      loading: {
        true: 'animate-pulse',
        false: '',
      },
      selected: {
        true: 'ring-2 ring-primary-500 border-primary-500',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
      loading: false,
      selected: false,
    },
  }
);

const cardHeaderVariants = cva('px-6 py-4 border-b border-gray-200');
const cardBodyVariants = cva('px-6 py-4');
const cardFooterVariants = cva('px-6 py-4 border-t border-gray-200 bg-gray-50');

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
  asChild?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// Main Card Component
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      interactive,
      loading,
      selected,
      children,
      onClick,
      onKeyDown,
      tabIndex,
      role,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isInteractive = Boolean(onClick || interactive);
    
    // Handle keyboard interactions for interactive cards
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick?.(event as any);
      }
      onKeyDown?.(event);
    };

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ 
            variant, 
            interactive: isInteractive, 
            loading, 
            selected 
          }),
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={isInteractive ? tabIndex ?? 0 : tabIndex}
        role={role || (isInteractive ? 'button' : undefined)}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </div>
    );
  }
);

// Card Header Component
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants(), className)}
      {...props}
    >
      {children}
    </div>
  )
);

// Card Body Component
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardBodyVariants(), className)}
      {...props}
    >
      {children}
    </div>
  )
);

// Card Footer Component
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants(), className)}
      {...props}
    >
      {children}
    </div>
  )
);

// Card Title Component (helper for common use case)
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
);

// Card Description Component (helper for common use case)
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600', className)}
      {...props}
    >
      {children}
    </p>
  )
);

// Loading Card Component
export const LoadingCard = ({ className, ...props }: Omit<CardProps, 'children'>) => (
  <Card className={cn('h-32', className)} loading {...props}>
    <div className="space-y-3 p-6">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  </Card>
);

// Empty Card Component
export const EmptyCard = ({ 
  title = 'No data',
  description = 'There is no data to display',
  action,
  className,
  ...props 
}: Omit<CardProps, 'children'> & {
  title?: string;
  description?: string;
  action?: ReactNode;
}) => (
  <Card className={cn('text-center', className)} {...props}>
    <CardBody>
      <div className="py-8">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="w-8 h-8 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-4">{description}</p>
        {action && <div>{action}</div>}
      </div>
    </CardBody>
  </Card>
);

// Set display names
Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';

export default Card;