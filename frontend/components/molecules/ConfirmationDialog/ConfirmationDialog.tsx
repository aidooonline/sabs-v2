'use client';

import React, { ReactNode, useEffect } from 'react';
import { cn } from '../../../utils/helpers';
import { Card, CardHeader, CardBody, CardFooter } from '../../atoms/Card';
import { Button } from '../../atoms/Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'info';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  preventCloseOnOutsideClick?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantConfig = {
  default: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmVariant: 'primary' as const,
  },
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmVariant: 'danger' as const,
  },
  warning: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    confirmVariant: 'primary' as const,
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmVariant: 'primary' as const,
  },
};

const sizeConfig = {
  sm: {
    dialogWidth: 'max-w-sm',
    iconSize: 'w-10 h-10',
    iconInnerSize: 'w-5 h-5',
  },
  md: {
    dialogWidth: 'max-w-md',
    iconSize: 'w-12 h-12',
    iconInnerSize: 'w-6 h-6',
  },
  lg: {
    dialogWidth: 'max-w-lg',
    iconSize: 'w-14 h-14',
    iconInnerSize: 'w-7 h-7',
  },
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  disabled = false,
  icon,
  className,
  preventCloseOnOutsideClick = false,
  size = 'md',
}) => {
  const config = variantConfig[variant];
  const sizeStyles = sizeConfig[size];

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !preventCloseOnOutsideClick && !loading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!disabled && !loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const defaultIcon = (
    <svg
      className={cn('w-full h-full', config.iconColor)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {variant === 'danger' ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      ) : variant === 'warning' ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      )}
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackdropClick}
      >
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
        />

        {/* Center alignment trick */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Dialog panel */}
        <div
          className={cn(
            'inline-block w-full transform transition-all sm:align-middle',
            sizeStyles.dialogWidth,
            className
          )}
        >
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center rounded-full',
                    sizeStyles.iconSize,
                    config.iconBg
                  )}
                >
                  <div className={sizeStyles.iconInnerSize}>
                    {icon || defaultIcon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h3
                    className="text-lg font-medium text-gray-900"
                    id="modal-title"
                  >
                    {title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{message}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardFooter>
              <div className="flex flex-col-reverse space-y-3 space-y-reverse sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end w-full">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={config.confirmVariant}
                  onClick={handleConfirm}
                  disabled={disabled}
                  loading={loading}
                  className="w-full sm:w-auto"
                >
                  {confirmText}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;