'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { 
  EnhancedLoginRequest,
  enhancedAuthService 
} from '@/services/api/enhancedAuthService';

// Icons
const EyeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const SecurityIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DeviceIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

export default function EnhancedLoginPage() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useMfaCode, setUseMfaCode] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [deviceName, setDeviceName] = useState('');
  
  // Generate device fingerprint on mount
  useEffect(() => {
    const fingerprint = enhancedAuthService.generateDeviceFingerprint();
    const name = enhancedAuthService.getDeviceName();
    setDeviceFingerprint(fingerprint);
    setDeviceName(name);
  }, []);

  // Form validation
  const isValidStep1 = email.trim() && password.trim();
  const isValidStep2 = requiresMfa && (
    (useMfaCode && mfaCode.trim().length === 6) ||
    (!useMfaCode && backupCode.trim())
  );

  // Handle initial login (step 1)
  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidStep1) return;

    setLoading(true);
    setError('');

    try {
      const loginData: EnhancedLoginRequest = {
        email: email.trim(),
        password,
        deviceFingerprint,
        deviceName,
        rememberDevice,
      };

      const response = await enhancedAuthService.enhancedLogin(loginData);

      if (response.requiresMfa) {
        setRequiresMfa(true);
      } else {
        // Login successful, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA verification (step 2)
  const handleMfaVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidStep2) return;

    setLoading(true);
    setError('');

    try {
      const loginData: EnhancedLoginRequest = {
        email: email.trim(),
        password,
        deviceFingerprint,
        deviceName,
        rememberDevice,
        ...(useMfaCode ? { mfaCode } : { backupCode }),
      };

      const response = await enhancedAuthService.enhancedLogin(loginData);
      
      // Login successful, redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'MFA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle back to credentials
  const handleBackToCredentials = () => {
    setRequiresMfa(false);
    setMfaCode('');
    setBackupCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <SecurityIcon className="text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {requiresMfa ? 'Two-Factor Authentication' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {requiresMfa 
              ? 'Enter your authentication code to complete sign in'
              : 'Secure access to the Sabs v2 platform'
            }
          </p>
        </div>

        {/* Progress indicator for MFA */}
        {requiresMfa && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="ml-2 text-sm text-gray-500">Credentials</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 rounded">
                <div className="h-1 bg-primary-600 rounded"></div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                  <span className="text-sm font-medium text-primary-600">2</span>
                </div>
                <span className="ml-2 text-sm text-gray-900 font-medium">MFA</span>
              </div>
            </div>
          </div>
        )}

        <Card className="p-8">
          {!requiresMfa ? (
            // Step 1: Email and Password
            <form onSubmit={handleInitialLogin} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Login Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-device"
                    name="remember-device"
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-device" className="ml-2 block text-sm text-gray-900">
                    Trust this device
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  fullWidth
                  disabled={!isValidStep1 || loading}
                  className="group relative"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Spinner size="sm" className="mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </div>

              {/* Device Information */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <DeviceIcon className="mr-2" />
                  <span>Device: {deviceName}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Fingerprint: {deviceFingerprint.substring(0, 12)}...
                </div>
              </div>
            </form>
          ) : (
            // Step 2: MFA Verification
            <form onSubmit={handleMfaVerification} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Verification Error</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* MFA Method Toggle */}
              <div className="flex rounded-lg border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setUseMfaCode(true)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    useMfaCode
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Authenticator Code
                </button>
                <button
                  type="button"
                  onClick={() => setUseMfaCode(false)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    !useMfaCode
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Backup Code
                </button>
              </div>

              {useMfaCode ? (
                <div>
                  <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
                    6-digit authentication code
                  </label>
                  <div className="mt-1">
                    <Input
                      id="mfa-code"
                      name="mfa-code"
                      type="text"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      disabled={loading}
                      className="text-center text-lg tracking-wider"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="backup-code" className="block text-sm font-medium text-gray-700">
                    Backup code
                  </label>
                  <div className="mt-1">
                    <Input
                      id="backup-code"
                      name="backup-code"
                      type="text"
                      required
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      placeholder="Enter backup code"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Use one of your saved backup codes
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToCredentials}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!isValidStep2 || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Spinner size="sm" className="mr-2" />
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Sign in'
                  )}
                </Button>
              </div>

              {/* Device Information */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <DeviceIcon className="mr-2" />
                  <span>Signing in as: {email}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Device: {deviceName}
                </div>
                {rememberDevice && (
                  <Badge variant="info" className="mt-2">
                    This device will be trusted
                  </Badge>
                )}
              </div>
            </form>
          )}
        </Card>

        {/* Security Features Information */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center">
              <SecurityIcon className="w-4 h-4 mr-1" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center">
              <DeviceIcon className="w-4 h-4 mr-1" />
              <span>Device Tracking</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>MFA Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}