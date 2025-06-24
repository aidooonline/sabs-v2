# Story 2.1: Build Foundational "Atom" Components - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 2 - Core UI Layout & Components  
**Story ID**: FRONTEND-2.1  
**Story Title**: Build Foundational "Atom" Components (Button, Input, Card)  
**Story Points**: 8  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** Frontend Developer  
**I want to** create foundational atomic components (Button, Input, Card) with consistent styling and behavior  
**So that** I have reusable, accessible, and well-tested UI building blocks that align with the design system and support the minimalist, security-first aesthetic

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Button Component Implementation**
- [ ] Create Button component with multiple variants (primary, secondary, danger, ghost)
- [ ] Support different sizes (small, medium, large)
- [ ] Implement loading and disabled states
- [ ] Add proper accessibility attributes (ARIA labels, focus management)
- [ ] Include icon support with proper positioning

### ✅ **AC 2: Input Component Implementation**
- [ ] Create Input component with various types (text, email, password, number)
- [ ] Implement validation states (error, success, warning)
- [ ] Add label, placeholder, and helper text support
- [ ] Include proper accessibility features (labels, error announcements)
- [ ] Support icons, prefixes, and suffixes

### ✅ **AC 3: Card Component Implementation**
- [ ] Create Card component with header, body, and footer sections
- [ ] Support different card variants (default, elevated, outlined)
- [ ] Implement interactive states (hover, focus, selected)
- [ ] Add proper spacing and layout management
- [ ] Include loading and empty states

### ✅ **AC 4: Design System Integration**
- [ ] Implement consistent color palette using Tailwind CSS
- [ ] Create typography scale with proper font weights and sizes
- [ ] Establish spacing and border radius standards
- [ ] Set up proper focus and hover states for accessibility
- [ ] Ensure mobile-responsive design across all components

### ✅ **AC 5: Testing and Documentation**
- [ ] Write comprehensive unit tests for each component
- [ ] Create Storybook stories for component documentation
- [ ] Implement accessibility testing with proper ARIA support
- [ ] Add TypeScript interfaces for all component props
- [ ] Create usage examples and guidelines

---

## 🏗️ Technical Implementation Guidelines

### **Design System Foundation**

#### **Color Palette (`styles/design-system.css`)**
```css
:root {
  /* Primary Colors - Security First Theme */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Success Colors */
  --color-success-50: #f0fdf4;
  --color-success-500: #10b981;
  --color-success-700: #047857;

  /* Error Colors */
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  --color-error-700: #b91c1c;

  /* Warning Colors */
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-700: #92400e;

  /* Neutral Colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Typography */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-base: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

#### **Tailwind Configuration Updates (`tailwind.config.js`)**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        success: {
          50: 'var(--color-success-50)',
          500: 'var(--color-success-500)',
          700: 'var(--color-success-700)',
        },
        error: {
          50: 'var(--color-error-50)',
          500: 'var(--color-error-500)',
          700: 'var(--color-error-700)',
        },
        warning: {
          50: 'var(--color-warning-50)',
          500: 'var(--color-warning-500)',
          700: 'var(--color-warning-700)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
```

### **Button Component Implementation**

#### **Button Component (`components/atoms/Button/Button.tsx`)**
```typescript
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

// Button variants using class-variance-authority
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white shadow hover:bg-primary-700 active:bg-primary-800',
        secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300',
        danger: 'bg-error-600 text-white shadow hover:bg-error-700 active:bg-error-800',
        ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
        outline: 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loadingText?: string;
}

const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      children,
      loading = false,
      leftIcon,
      rightIcon,
      loadingText,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <LoadingSpinner className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{loading && loadingText ? loadingText : children}</span>
        {!loading && rightIcon && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

#### **Button Types (`components/atoms/Button/types.ts`)**
```typescript
import { ButtonProps } from './Button';

export type { ButtonProps };

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
```

### **Input Component Implementation**

#### **Input Component (`components/atoms/Input/Input.tsx`)**
```typescript
import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const inputVariants = cva(
  // Base styles
  'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
      state: {
        default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
        error: 'border-error-500 focus:border-error-500 focus:ring-error-500 bg-error-50',
        success: 'border-success-500 focus:border-success-500 focus:ring-success-500 bg-success-50',
        warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500 bg-warning-50',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  required?: boolean;
  showRequiredIndicator?: boolean;
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
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      id,
      required,
      showRequiredIndicator = true,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = `${inputId}-helper-text`;
    const errorTextId = `${inputId}-error-text`;
    
    // Determine the current state
    const currentState = errorMessage ? 'error' : state || 'default';
    
    // Helper text to display (error message takes precedence)
    const displayHelperText = errorMessage || helperText;
    const helperTextColor = errorMessage 
      ? 'text-error-600' 
      : state === 'success' 
      ? 'text-success-600'
      : state === 'warning'
      ? 'text-warning-600'
      : 'text-gray-500';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && showRequiredIndicator && (
              <span className="text-error-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {/* Left Icon/Element */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}
          {leftElement && (
            <div className="absolute inset-y-0 left-0 flex items-center">
              {leftElement}
            </div>
          )}
          
          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ size, state: currentState }),
              leftIcon && 'pl-10',
              leftElement && 'pl-12',
              rightIcon && 'pr-10',
              rightElement && 'pr-12',
              className
            )}
            aria-invalid={currentState === 'error'}
            aria-describedby={
              displayHelperText 
                ? errorMessage 
                  ? errorTextId 
                  : helperTextId
                : undefined
            }
            required={required}
            {...props}
          />
          
          {/* Right Icon/Element */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        
        {/* Helper Text */}
        {displayHelperText && (
          <p
            id={errorMessage ? errorTextId : helperTextId}
            className={cn('mt-1 text-xs', helperTextColor)}
            role={errorMessage ? 'alert' : 'status'}
          >
            {displayHelperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

### **Card Component Implementation**

#### **Card Component (`components/atoms/Card/Card.tsx`)**
```typescript
import React, { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const cardVariants = cva(
  // Base styles
  'bg-white rounded-lg transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border border-gray-200',
        elevated: 'shadow-lg border-0',
        outlined: 'border-2 border-gray-300',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        false: '',
      },
      selected: {
        true: 'ring-2 ring-primary-500 border-primary-500',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
      selected: false,
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
  loading?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
);

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      interactive,
      selected,
      children,
      loading = false,
      header,
      footer,
      onClick,
      ...props
    },
    ref
  ) => {
    const isClickable = interactive || !!onClick;
    
    const cardElement = (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive: isClickable, selected }),
          className
        )}
        onClick={onClick}
        tabIndex={isClickable ? 0 : undefined}
        role={isClickable ? 'button' : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as any);
                }
              }
            : undefined
        }
        {...props}
      >
        {loading ? (
          <CardSkeleton />
        ) : (
          <>
            {header && (
              <div className={cn(
                'border-b border-gray-200 pb-4 mb-4',
                padding === 'none' && 'px-6 pt-6'
              )}>
                {header}
              </div>
            )}
            
            <div className={padding === 'none' ? 'px-6' : ''}>
              {children}
            </div>
            
            {footer && (
              <div className={cn(
                'border-t border-gray-200 pt-4 mt-4',
                padding === 'none' && 'px-6 pb-6'
              )}>
                {footer}
              </div>
            )}
          </>
        )}
      </div>
    );

    return cardElement;
  }
);

Card.displayName = 'Card';

export default Card;
```

### **Utility Functions**

#### **Class Name Utility (`utils/helpers.ts`)**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Additional utility functions for components
export const formatCurrency = (amount: number, currency = 'GHS'): string => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};
```

---

## 🧪 Testing Implementation

### **Button Component Tests (`components/atoms/Button/__tests__/Button.test.tsx`)**
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@/utils/test-utils';
import Button from '../Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading loadingText="Loading...">Submit</Button>);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with icons', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    const rightIcon = <span data-testid="right-icon">→</span>;
    
    render(
      <Button leftIcon={leftIcon} rightIcon={rightIcon}>
        Button with icons
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-error-600');
  });
});
```

### **Input Component Tests (`components/atoms/Input/__tests__/Input.test.tsx`)**
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@/utils/test-utils';
import Input from '../Input';

describe('Input Component', () => {
  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <Input 
        label="Email" 
        errorMessage="Email is required"
        aria-invalid="true"
      />
    );
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<Input label="Name" required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });
});
```

---

## 📝 Definition of Done

### **Component Implementation**
- [ ] Button component with all variants and states
- [ ] Input component with validation states and accessibility
- [ ] Card component with interactive and loading states
- [ ] Proper TypeScript interfaces for all components
- [ ] Responsive design across all screen sizes

### **Design System**
- [ ] Consistent color palette implemented
- [ ] Typography scale established
- [ ] Spacing and layout standards
- [ ] Focus and hover states for accessibility
- [ ] Mobile-first responsive design

### **Testing**
- [ ] Unit tests for all components (>95% coverage)
- [ ] Accessibility testing with proper ARIA support
- [ ] Visual regression testing setup
- [ ] Component interaction testing
- [ ] Error state and edge case testing

### **Documentation**
- [ ] Storybook stories for each component
- [ ] Usage examples and guidelines
- [ ] Props documentation
- [ ] Accessibility guidelines
- [ ] Design system documentation

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project
- ✅ Story 1.2: Implement Defined Directory Structure
- ✅ Story 1.3: Configure Global State (Redux) with sessionSlice
- ✅ Story 1.4: Implement Central API Client (Axios)

**Next Stories:**
- Story 2.2: Implement Main Application Layout (including Bottom Tab Bar)

---

## 📈 Success Metrics

- [ ] **Component Reusability**: Components used across >5 different pages
- [ ] **Accessibility Score**: WCAG 2.1 AA compliance (>95%)
- [ ] **Performance**: Components render in <16ms (60fps)
- [ ] **Test Coverage**: >95% unit test coverage
- [ ] **Developer Experience**: Clear TypeScript intellisense and documentation

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story establishes the foundational atomic components that will serve as the building blocks for the entire Sabs v2 frontend, ensuring consistency, accessibility, and maintainability across the application.*