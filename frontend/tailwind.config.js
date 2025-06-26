/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sabs v2 Design System Colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // Dashboard-specific colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Approval workflow-specific colors
        approval: {
          pending: '#f59e0b',
          approved: '#10b981',
          rejected: '#ef4444',
          escalated: '#8b5cf6',
          expired: '#6b7280',
          canceled: '#64748b',
        },
        risk: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#dc2626',
        },
        priority: {
          low: '#64748b',
          medium: '#f59e0b',
          high: '#f97316',
          urgent: '#dc2626',
          critical: '#991b1b',
        },
        compliance: {
          passed: '#22c55e',
          warning: '#f59e0b',
          failed: '#ef4444',
          pending: '#6b7280',
        },
        // Customer management-specific colors
        customer: {
          verified: '#10b981',
          pending: '#f59e0b',
          unverified: '#ef4444',
          inactive: '#6b7280',
          suspended: '#dc2626',
          background: '#f9fafb',
          card: '#ffffff',
          border: '#e5e7eb',
        },
        verification: {
          verified: '#10b981',
          pending: '#f59e0b',
          rejected: '#ef4444',
          expired: '#6b7280',
          in_review: '#8b5cf6',
        },
        account: {
          active: '#10b981',
          inactive: '#6b7280',
          frozen: '#f59e0b',
          closed: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Dashboard-specific spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Dashboard layout breakpoints
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      // Dashboard animation
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Dashboard shadows
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      // Dashboard border radius
      borderRadius: {
        'card': '0.5rem',
        'modal': '0.75rem',
      },
    },
  },
  plugins: [
    // Custom dashboard utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.dashboard-grid': {
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        },
        '.dashboard-card': {
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '1.5rem',
          transition: 'all 0.2s ease-in-out',
        },
        '.dashboard-card:hover': {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transform: 'translateY(-1px)',
        },
        '.metric-positive': {
          color: '#22c55e',
        },
        '.metric-negative': {
          color: '#ef4444',
        },
        '.metric-neutral': {
          color: '#6b7280',
        },
        '.skeleton': {
          backgroundColor: '#f3f4f6',
          borderRadius: '0.25rem',
          animation: 'pulse 2s infinite',
        },
        // Approval workflow utilities
        '.approval-queue': {
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        },
        '.approval-card': {
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          transition: 'all 0.2s ease-in-out',
        },
        '.approval-card:hover': {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transform: 'translateY(-2px)',
          borderColor: '#d1d5db',
        },
        '.approval-card.selected': {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
        },
        '.status-badge-pending': {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.status-badge-approved': {
          backgroundColor: '#dcfce7',
          color: '#166534',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.status-badge-rejected': {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.status-badge-escalated': {
          backgroundColor: '#ede9fe',
          color: '#7c3aed',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.risk-indicator-low': {
          backgroundColor: '#22c55e',
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.risk-indicator-medium': {
          backgroundColor: '#f59e0b',
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.risk-indicator-high': {
          backgroundColor: '#f97316',
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.risk-indicator-critical': {
          backgroundColor: '#dc2626',
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.priority-bar': {
          height: '0.25rem',
          borderRadius: '0.125rem',
          backgroundColor: '#e5e7eb',
          position: 'relative',
          overflow: 'hidden',
        },
        '.priority-bar-low': {
          backgroundColor: '#64748b',
        },
        '.priority-bar-medium': {
          backgroundColor: '#f59e0b',
        },
        '.priority-bar-high': {
          backgroundColor: '#f97316',
        },
        '.priority-bar-urgent': {
          backgroundColor: '#dc2626',
        },
        '.priority-bar-critical': {
          backgroundColor: '#991b1b',
          animation: 'pulse 1s infinite',
        },
        '.approval-button': {
          minHeight: '3rem',
          minWidth: '3rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          borderRadius: '0.5rem',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
        },
        '.approval-button:focus': {
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
        },
        '.approval-button-approve': {
          backgroundColor: '#22c55e',
          color: 'white',
        },
        '.approval-button-approve:hover': {
          backgroundColor: '#16a34a',
        },
        '.approval-button-reject': {
          backgroundColor: '#ef4444',
          color: 'white',
        },
        '.approval-button-reject:hover': {
          backgroundColor: '#dc2626',
        },
        '.approval-button-escalate': {
          backgroundColor: '#8b5cf6',
          color: 'white',
        },
        '.approval-button-escalate:hover': {
          backgroundColor: '#7c3aed',
        },
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
        // Customer management utilities
        '.customer-grid': {
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        },
        '.customer-card': {
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          transition: 'all 0.2s ease-in-out',
        },
        '.customer-card:hover': {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transform: 'translateY(-2px)',
          borderColor: '#d1d5db',
        },
        '.customer-card.selected': {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
        },
        '.customer-search': {
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: '1fr',
        },
        '@media (min-width: 768px)': {
          '.customer-search': {
            gridTemplateColumns: '1fr auto',
          },
        },
        '.verification-badge-verified': {
          backgroundColor: '#dcfce7',
          color: '#166534',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.verification-badge-pending': {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.verification-badge-rejected': {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.verification-badge-in_review': {
          backgroundColor: '#ede9fe',
          color: '#7c3aed',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.account-status-active': {
          backgroundColor: '#10b981',
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.account-status-inactive': {
          backgroundColor: '#6b7280',
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.account-status-frozen': {
          backgroundColor: '#f59e0b',
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.account-status-closed': {
          backgroundColor: '#ef4444',
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          display: 'inline-block',
        },
        '.customer-action-panel': {
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
        },
        '.customer-action-button': {
          minHeight: '2.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          borderRadius: '0.375rem',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          border: '1px solid #d1d5db',
          backgroundColor: 'white',
          color: '#374151',
        },
        '.customer-action-button:hover': {
          backgroundColor: '#f9fafb',
          borderColor: '#9ca3af',
        },
        '.customer-action-button.primary': {
          backgroundColor: '#3b82f6',
          color: 'white',
          borderColor: '#3b82f6',
        },
        '.customer-action-button.primary:hover': {
          backgroundColor: '#2563eb',
          borderColor: '#2563eb',
        },
        '.customer-search-filters': {
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
        },
        '.customer-table-responsive': {
          overflowX: 'auto',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
        },
        '@media (max-width: 768px)': {
          '.customer-table-responsive table': {
            minWidth: '700px',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}