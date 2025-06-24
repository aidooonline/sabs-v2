import React from 'react';
import { Input, type InputProps } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';

export interface FormFieldProps extends Omit<InputProps, 'label'> {
  label: string;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  labelVariant?: 'default' | 'required' | 'optional';
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helpText,
  errorMessage,
  labelVariant,
  id,
  className = '',
  ...inputProps
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const helpTextId = helpText ? `${fieldId}-help` : undefined;
  const errorId = errorMessage ? `${fieldId}-error` : undefined;

  // Determine label variant based on props
  const determinedLabelVariant = labelVariant || (required ? 'required' : 'default');

  return (
    <div className={`space-y-1 ${className}`}>
      <Label
        htmlFor={fieldId}
        variant={errorMessage ? 'error' : determinedLabelVariant}
      >
        {label}
      </Label>
      
      <Input
        id={fieldId}
        error={errorMessage}
        aria-describedby={[helpTextId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!errorMessage}
        required={required}
        {...inputProps}
      />
      
      {helpText && !errorMessage && (
        <p
          id={helpTextId}
          className="text-sm text-gray-600"
        >
          {helpText}
        </p>
      )}
      
      {errorMessage && (
        <p
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default FormField;