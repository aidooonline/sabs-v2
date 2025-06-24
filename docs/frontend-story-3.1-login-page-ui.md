# Story 3.1: Build Login Page UI - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 3 - Authentication Flow  
**Story ID**: FRONTEND-3.1  
**Story Title**: Build Login Page UI  
**Story Points**: 5  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** User  
**I want to** access a secure, professional login page  
**So that** I can authenticate into the Sabs v2 platform with confidence in the security and reliability of the system

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Login Form Implementation**
- [ ] Create login form with email/username and password fields
- [ ] Implement form validation with proper error messages
- [ ] Add "Remember Me" checkbox for session persistence
- [ ] Include "Forgot Password" link for password recovery
- [ ] Support both email and username authentication

### ✅ **AC 2: Security-First Design**
- [ ] Implement minimalist, professional design aesthetic
- [ ] Add security indicators and trust signals
- [ ] Include password visibility toggle
- [ ] Display clear error messages without revealing system details
- [ ] Implement proper accessibility features

### ✅ **AC 3: Responsive & Mobile-Friendly**
- [ ] Ensure mobile-first responsive design
- [ ] Optimize for various screen sizes and orientations
- [ ] Support touch interactions and mobile keyboards
- [ ] Ensure form elements are touch-friendly (44px targets)
- [ ] Handle safe areas and notches on mobile devices

### ✅ **AC 4: Loading & Error States**
- [ ] Implement loading state during authentication
- [ ] Show clear error messages for failed attempts
- [ ] Display account lockout warnings when applicable
- [ ] Provide feedback for network/connection issues
- [ ] Support retry mechanisms for failed requests

### ✅ **AC 5: Accessibility & UX**
- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Support keyboard navigation throughout
- [ ] Implement proper ARIA labels and descriptions
- [ ] Provide clear focus indicators
- [ ] Support screen readers with meaningful announcements

---

## 🏗️ Technical Implementation Guidelines

### **Login Page Implementation**

#### **Login Page (`app/(auth)/login/page.tsx`)**
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { cn } from '@/utils/helpers';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const initialFormData: LoginFormData = {
  email: '',
  password: '',
  rememberMe: false,
};

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearAuthError, isAuthenticated } = useAuth();
  const { showNotification } = useUI();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = searchParams.get('returnTo') || '/dashboard';
      router.replace(returnTo);
    }
  }, [isAuthenticated, router, searchParams]);

  // Clear errors when form data changes
  useEffect(() => {
    if (error) {
      clearAuthError();
    }
    setFormErrors({});
  }, [formData, error, clearAuthError]);

  // Handle form input changes
  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email or username is required';
    } else if (
      formData.email.includes('@') && 
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (result.type === 'fulfilled') {
        showNotification('success', 'Login successful! Welcome back.');
        const returnTo = searchParams.get('returnTo') || '/dashboard';
        router.replace(returnTo);
      }
    } catch (err) {
      // Error is handled by Redux and will show in the UI
      console.error('Login error:', err);
    }
  };

  // Handle "Enter" key submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to Sabs v2
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure micro-finance platform
          </p>
        </div>

        {/* Login Form */}
        <Card className="mt-8 space-y-6" padding="lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Global Error Message */}
            {error && (
              <div 
                className="bg-error-50 border border-error-200 rounded-md p-4"
                role="alert"
                aria-live="polite"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-error-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email/Username Field */}
            <Input
              id="email"
              label="Email or Username"
              type="text"
              value={formData.email}
              onChange={handleInputChange('email')}
              onKeyDown={handleKeyDown}
              errorMessage={formErrors.email}
              required
              autoComplete="username"
              placeholder="Enter your email or username"
              disabled={isLoading}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            {/* Password Field */}
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              onKeyDown={handleKeyDown}
              errorMessage={formErrors.password}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isLoading}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              rightElement={
                <button
                  type="button"
                  className="px-3 py-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              }
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange('rememberMe')}
                  disabled={isLoading}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              loadingText="Signing in..."
              disabled={isLoading}
            >
              Sign in
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure SSL connection</span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 Sabs v2. All rights reserved.</p>
          <p className="mt-1">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### **Auth Layout Component**

#### **Auth Layout (`app/(auth)/layout.tsx`)**
```typescript
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/utils/helpers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Login - Sabs v2',
  description: 'Sign in to your Sabs v2 account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(inter.className, 'min-h-screen bg-gray-50')}>
      {children}
    </div>
  );
}
```

---

## 🧪 Testing Implementation

### **Login Page Tests**
```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';

// Mock hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearAuthError: jest.fn(),
    isAuthenticated: false,
  }),
}));

describe('Login Page', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockPush,
    });
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: /sign in to sabs v2/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email or username is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByLabelText(/show password/i);
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('handles form submission', async () => {
    const mockLogin = jest.fn();
    
    // Update mock to return login function
    require('@/hooks/useAuth').useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearAuthError: jest.fn(),
      isAuthenticated: false,
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
  });
});
```

---

## 📝 Definition of Done

### **UI Implementation**
- [ ] Complete login form with email/password fields
- [ ] Form validation with proper error handling
- [ ] Password visibility toggle functionality
- [ ] Remember me checkbox and forgot password link
- [ ] Professional, security-first visual design

### **Responsive Design**
- [ ] Mobile-first responsive layout
- [ ] Touch-friendly form elements (44px targets)
- [ ] Proper keyboard support and navigation
- [ ] Safe area handling for mobile devices
- [ ] Optimized for various screen sizes

### **Security & Trust**
- [ ] No sensitive information exposed in errors
- [ ] Clear security indicators and SSL notice
- [ ] Proper form validation and sanitization
- [ ] Protection against common attacks
- [ ] Professional appearance to build trust

### **Accessibility**
- [ ] WCAG 2.1 AA compliance
- [ ] Proper ARIA labels and descriptions
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Clear focus indicators

### **Testing**
- [ ] Unit tests for form functionality
- [ ] Form validation testing
- [ ] Accessibility testing
- [ ] Responsive design testing
- [ ] Error state testing

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project
- ✅ Story 1.2: Implement Defined Directory Structure  
- ✅ Story 1.3: Configure Global State (Redux) with sessionSlice
- ✅ Story 1.4: Implement Central API Client (Axios)
- ✅ Story 2.1: Build Foundational "Atom" Components
- ✅ Story 2.2: Implement Main Application Layout
- ✅ Story 2.3: Build Main Menu Screen

**Next Stories:**
- Story 3.2: Implement Login Logic (connecting to API and Redux)

---

## 📈 Success Metrics

- [ ] **Form Completion Rate**: >95% of users complete form
- [ ] **Error Rate**: <5% form validation errors
- [ ] **Accessibility Score**: WCAG 2.1 AA compliance
- [ ] **Mobile Usability**: >95% mobile interaction success
- [ ] **Loading Performance**: Page loads in <1 second

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story creates a professional, secure, and accessible login page that builds user trust while providing a smooth authentication experience across all devices.*