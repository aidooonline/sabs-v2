'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
// Using inline SVG icons instead of heroicons to avoid dependency issues
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    login, 
    mfaVerify, 
    isLoading, 
    error, 
    clearAuthError, 
    isAuthenticated,
    requiresMfa,
    mfaToken,
    accountLocked,
    loginAttempts
  } = useAuth();
  const { showNotification } = useUI();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mfaError, setMfaError] = useState('');

  // Clear errors when user types
  useEffect(() => {
    if (emailError) setEmailError('');
  }, [email, emailError]);

  useEffect(() => {
    if (passwordError) setPasswordError('');
  }, [password, passwordError]);

  useEffect(() => {
    if (mfaError) setMfaError('');
  }, [mfaCode, mfaError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = searchParams.get('returnTo') || '/dashboard';
      router.replace(returnTo);
    }
  }, [isAuthenticated, router, searchParams]);

  // Clear auth error when component mounts
  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  // Show notification for account lockout
  useEffect(() => {
    if (accountLocked) {
      showNotification('error', 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.');
    }
  }, [accountLocked, showNotification]);

  const validateEmail = (email: string) => {
    if (!email) {
      return 'Email or username is required';
    }
    
    // Check if it's an email (contains @)
    if (email.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
      }
    } else {
      // Username validation
      if (email.length < 3) {
        return 'Username must be at least 3 characters';
      }
    }
    
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateMfaCode = (code: string) => {
    if (!code) {
      return 'MFA code is required';
    }
    if (code.length !== 6) {
      return 'MFA code must be 6 digits';
    }
    if (!/^\d+$/.test(code)) {
      return 'MFA code must contain only numbers';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requiresMfa) {
      handleMfaSubmit();
      return;
    }

    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    clearAuthError();

    // Validate form
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (accountLocked) {
      showNotification('error', 'Your account is temporarily locked. Please try again later.');
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (result.meta.requestStatus === 'fulfilled') {
        showNotification('success', requiresMfa ? 'Please enter your MFA code to complete login.' : 'Welcome back!');
      }
    } catch (err) {
      // Error handled by Redux and displayed in UI
    }
  };

  const handleMfaSubmit = async () => {
    setMfaError('');
    
    const mfaValidation = validateMfaCode(mfaCode);
    if (mfaValidation) {
      setMfaError(mfaValidation);
      return;
    }

    if (!mfaToken) {
      setMfaError('MFA session expired. Please login again.');
      return;
    }

    try {
      const result = await mfaVerify({
        mfaToken,
        code: mfaCode,
        rememberDevice: rememberMe,
      });

      if (result.meta.requestStatus === 'fulfilled') {
        showNotification('success', 'Login completed successfully!');
      }
    } catch (err) {
      // Error handled by Redux and displayed in UI
    }
  };

  const getRemainingAttempts = () => {
    const maxAttempts = 5;
    return Math.max(0, maxAttempts - loginAttempts);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-600">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {requiresMfa ? 'Enter Verification Code' : 'Sign in to your account'}
        </h2>
        {!requiresMfa && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure access to Sabs v2 platform
          </p>
        )}
        {requiresMfa && (
          <p className="mt-2 text-center text-sm text-gray-600">
            We have sent a verification code to your registered device. Please enter it below.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Standard Login Form */}
            {!requiresMfa && (
              <>
                {/* Email/Username Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email or Username
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading || accountLocked}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your email or username"
                      aria-describedby={emailError ? 'email-error' : undefined}
                      aria-invalid={emailError ? 'true' : 'false'}
                    />
                    {emailError && (
                      <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || accountLocked}
                      className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your password"
                      aria-describedby={passwordError ? 'password-error' : undefined}
                      aria-invalid={passwordError ? 'true' : 'false'}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || accountLocked}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                                             {showPassword ? (
                         <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                         </svg>
                       ) : (
                         <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                       )}
                    </button>
                  </div>
                  {passwordError && (
                    <p id="password-error" className="mt-2 text-sm text-red-600" role="alert">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading || accountLocked}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:cursor-not-allowed"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      href="/forgot-password"
                      className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* MFA Code Field */}
            {requiresMfa && (
              <div>
                <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="mfa-code"
                    name="mfa-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg tracking-widest"
                    placeholder="000000"
                    aria-describedby={mfaError ? 'mfa-error' : undefined}
                    aria-invalid={mfaError ? 'true' : 'false'}
                  />
                  {mfaError && (
                    <p id="mfa-error" className="mt-2 text-sm text-red-600" role="alert">
                      {mfaError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
                             <div className="rounded-md bg-red-50 p-4" role="alert">
                 <div className="flex">
                   <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                   <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Authentication Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                      {loginAttempts > 0 && !accountLocked && (
                        <p className="mt-1">
                          {getRemainingAttempts()} attempt{getRemainingAttempts() !== 1 ? "s" : ""} remaining
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || accountLocked}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 transition duration-150 ease-in-out"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {requiresMfa ? 'Verifying...' : 'Signing in...'}
                  </>
                ) : (
                  requiresMfa ? 'Verify Code' : 'Sign in'
                )}
              </button>
            </div>

            {/* MFA Back Button */}
            {requiresMfa && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                >
                  Back to login
                </button>
              </div>
            )}
          </form>

          {/* Security Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                             <div className="flex items-center">
                 <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                 </svg>
                 <span>SSL Secured</span>
               </div>
              <span>•</span>
              <span>© 2024 Sabs v2</span>
            </div>
            <div className="mt-2 text-center">
              <Link
                href="/privacy"
                className="text-xs text-gray-500 hover:text-gray-700 mr-4"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}