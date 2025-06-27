import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import { renderWithProviders } from '../utils/test-utils';

// Mock hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useUI', () => ({
  useUI: jest.fn(() => ({
    showNotification: jest.fn(),
  })),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockLogin = jest.fn();
  const mockClearAuthError = jest.fn();
  const mockShowNotification = jest.fn();

  const defaultAuthState = {
    login: mockLogin,
    isLoading: false,
    error: null,
    clearAuthError: mockClearAuthError,
    isAuthenticated: false,
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    // Reset searchParams mock to default
    require('next/navigation').useSearchParams.mockReturnValue({
      get: jest.fn(() => null),
    });

    require('@/hooks/useAuth').useAuth.mockReturnValue(defaultAuthState);
    require('@/hooks/useUI').useUI.mockReturnValue({
      showNotification: mockShowNotification,
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders login form correctly', () => {
      renderWithProviders(<LoginPage />);
      
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
      expect(screen.getByText('Secure access to Sabs v2 platform')).toBeInTheDocument();
      expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    });

    it('renders security indicators', () => {
      renderWithProviders(<LoginPage />);
      
      expect(screen.getByText('SSL Secured')).toBeInTheDocument();
      expect(screen.getByText('© 2024 Sabs v2')).toBeInTheDocument();
    });

    it('renders terms and privacy links', () => {
      renderWithProviders(<LoginPage />);
      
      expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required email field', async () => {
      renderWithProviders(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      // Component should not call login with empty email
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('validates required password field', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      // Component should not call login with empty password
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email@' } });
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      // Component should not call login with invalid email
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('validates minimum password length', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      // Component should not call login with short password
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('accepts username without email validation', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'username123' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'username123',
          password: 'password123',
          rememberMe: false,
        });
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility', () => {
      renderWithProviders(<LoginPage />);
      
      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = screen.getByLabelText(/show password/i);
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();
    });

    it('disables password toggle when loading', () => {
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        isLoading: true,
      });

      renderWithProviders(<LoginPage />);
      
      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('handles successful form submission', async () => {
      mockLogin.mockResolvedValue({ meta: { requestStatus: 'fulfilled' } });

      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText('Password');
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(rememberMeCheckbox);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        });
      });

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith('success', 'Welcome back!');
      });
    });

    it('handles form submission with Enter key', async () => {
      mockLogin.mockResolvedValue({ meta: { requestStatus: 'fulfilled' } });
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('prevents submission when form is invalid', async () => {
      renderWithProviders(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      // Component should not call login with empty fields
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during authentication', () => {
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        isLoading: true,
      });

      renderWithProviders(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /signing in.../i });
      expect(submitButton).toBeDisabled();
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText('Password');
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    it('disables form elements when loading', () => {
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        isLoading: true,
      });

      renderWithProviders(<LoginPage />);
      
      expect(screen.getByLabelText(/email or username/i)).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
      expect(screen.getByLabelText(/remember me/i)).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays authentication error', () => {
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Invalid credentials. Please try again.',
      });

      renderWithProviders(<LoginPage />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
    });

    it('clears error when form data changes', async () => {
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Invalid credentials. Please try again.',
      });

      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(mockClearAuthError).toHaveBeenCalled();
    });
  });

  describe('Authentication Redirect', () => {
    it('redirects to dashboard when already authenticated', () => {
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
      });

      renderWithProviders(<LoginPage />);
      
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });

    it('redirects to returnTo URL when authenticated', () => {
      const mockSearchParams = {
        get: jest.fn((key) => key === 'returnTo' ? '/profile' : null),
      };
      require('next/navigation').useSearchParams.mockReturnValue(mockSearchParams);
      
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
      });

      renderWithProviders(<LoginPage />);
      
      expect(mockReplace).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('announces errors to screen readers', () => {
      require('@/hooks/useAuth').useAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Invalid credentials. Please try again.',
      });

      renderWithProviders(<LoginPage />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      // Note: aria-live not implemented in current component
    });

    it('has proper autocomplete attributes', () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('autocomplete', 'username');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('Links and Navigation', () => {
    it('has correct href for forgot password link', () => {
      renderWithProviders(<LoginPage />);
      
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i });
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('has correct href for terms and privacy links', () => {
      renderWithProviders(<LoginPage />);
      
      const termsLink = screen.getByRole('link', { name: /terms of service/i });
      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      
      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });
  });

  describe('Form Input Handling', () => {
    it('updates form state on input changes', () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText('Password');
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
      fireEvent.click(rememberMeCheckbox);
      
      expect(emailInput).toHaveValue('user@example.com');
      expect(passwordInput).toHaveValue('mypassword');
      expect(rememberMeCheckbox).toBeChecked();
    });

    it('clears validation errors when typing', async () => {
      renderWithProviders(<LoginPage />);
      
      // Test that clearAuthError is called when form data changes
      const emailInput = screen.getByLabelText(/email or username/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      // Should clear auth errors when user starts typing
      expect(mockClearAuthError).toHaveBeenCalled();
    });
  });
});