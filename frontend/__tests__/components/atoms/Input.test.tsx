import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Input } from '../../../components/atoms/Input';

describe('Input Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('generates unique id when not provided', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id');
      expect(input.id).toMatch(/^input-/);
    });

    it('uses provided id', () => {
      render(<Input id="custom-id" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  // Label tests
  describe('Labels', () => {
    it('renders with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('associates label with input', () => {
      render(<Input label="Email" id="email-input" />);
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'email-input');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('shows required indicator when required', () => {
      render(<Input label="Required Field" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('hides required indicator when showRequiredIndicator is false', () => {
      render(<Input label="Required Field" required showRequiredIndicator={false} />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  // Size tests
  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Input size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-8');
    });

    it('renders medium size (default)', () => {
      render(<Input size="md" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10');
    });

    it('renders large size', () => {
      render(<Input size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12');
    });
  });

  // State tests
  describe('States', () => {
    it('renders default state', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-300');
    });

    it('renders error state', () => {
      render(<Input state="error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('renders success state', () => {
      render(<Input state="success" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-green-500');
    });

    it('renders warning state', () => {
      render(<Input state="warning" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-yellow-500');
    });
  });

  // Message tests
  describe('Messages', () => {
    it('displays helper text', () => {
      render(<Input helperText="This is helper text" />);
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(<Input errorMessage="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('displays success message', () => {
      render(<Input successMessage="Input is valid" />);
      expect(screen.getByText('Input is valid')).toBeInTheDocument();
    });

    it('displays warning message', () => {
      render(<Input warningMessage="Please verify this input" />);
      expect(screen.getByText('Please verify this input')).toBeInTheDocument();
    });

    it('prioritizes error message over other messages', () => {
      render(
        <Input
          errorMessage="Error message"
          warningMessage="Warning message"
          successMessage="Success message"
          helperText="Helper text"
        />
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  // Icon tests
  describe('Icons', () => {
    const testIcon = <span data-testid="test-icon">icon</span>;

    it('renders left icon', () => {
      render(<Input leftIcon={testIcon} />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(<Input rightIcon={testIcon} />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('adjusts padding for left icon', () => {
      render(<Input leftIcon={testIcon} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('adjusts padding for right icon', () => {
      render(<Input rightIcon={testIcon} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-10');
    });
  });

  // Element tests
  describe('Elements', () => {
    const testElement = <button data-testid="test-element">element</button>;

    it('renders left element', () => {
      render(<Input leftElement={testElement} />);
      expect(screen.getByTestId('test-element')).toBeInTheDocument();
    });

    it('renders right element', () => {
      render(<Input rightElement={testElement} />);
      expect(screen.getByTestId('test-element')).toBeInTheDocument();
    });

    it('adjusts padding for left element', () => {
      render(<Input leftElement={testElement} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-12');
    });

    it('adjusts padding for right element', () => {
      render(<Input rightElement={testElement} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-12');
    });
  });

  // Input types
  describe('Input Types', () => {
    it('renders email type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password type', () => {
      const { container } = render(<Input type="password" />);
      const input = container.querySelector('input[type="password"]');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number type', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('handles user input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('handles onChange events', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper textbox role', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('associates error message with input', () => {
      render(<Input errorMessage="Error message" id="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('test-input-error-text'));
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('associates helper text with input', () => {
      render(<Input helperText="Helper text" id="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('test-input-helper-text'));
    });

    it('has required attribute when required', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });

    it('supports custom aria-describedby', () => {
      render(<Input aria-describedby="custom-description" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('custom-description'));
    });

    it('has proper aria-live for error messages', () => {
      render(<Input errorMessage="Error message" />);
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  // Disabled state
  describe('Disabled State', () => {
    it('handles disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('cannot be focused when disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      
      fireEvent.click(input);
      expect(input).not.toHaveFocus();
    });
  });

  // Full width
  describe('Full Width', () => {
    it('renders full width by default', () => {
      render(<Input />);
      const container = screen.getByRole('textbox').parentElement?.parentElement;
      expect(container).toHaveClass('w-full');
    });

    it('renders auto width when fullWidth is false', () => {
      render(<Input fullWidth={false} />);
      const container = screen.getByRole('textbox').parentElement?.parentElement;
      expect(container).toHaveClass('w-auto');
    });
  });
});