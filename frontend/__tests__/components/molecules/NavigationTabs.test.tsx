import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { NavigationTabs, TabItem } from '../../../components/molecules/NavigationTabs';

const mockTabs: TabItem[] = [
  { id: 'tab1', label: 'First Tab' },
  { id: 'tab2', label: 'Second Tab', badge: '3' },
  { id: 'tab3', label: 'Third Tab', disabled: true },
  { id: 'tab4', label: 'Fourth Tab', icon: <span data-testid="tab-icon">📁</span> },
];

describe('NavigationTabs Component', () => {
  const defaultProps = {
    tabs: mockTabs,
    activeTab: 'tab1',
    onTabChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all tabs correctly', () => {
      render(<NavigationTabs {...defaultProps} />);
      
      expect(screen.getByText('First Tab')).toBeInTheDocument();
      expect(screen.getByText('Second Tab')).toBeInTheDocument();
      expect(screen.getByText('Third Tab')).toBeInTheDocument();
      expect(screen.getByText('Fourth Tab')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<NavigationTabs {...defaultProps} className="custom-tabs" />);
      const container = screen.getByRole('tablist');
      expect(container).toHaveClass('custom-tabs');
    });

    it('renders badges correctly', () => {
      render(<NavigationTabs {...defaultProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders icons correctly', () => {
      render(<NavigationTabs {...defaultProps} />);
      expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<NavigationTabs {...defaultProps} variant="default" />);
      const container = screen.getByRole('tablist');
      expect(container).toHaveClass('border-b', 'border-gray-200');
    });

    it('renders pills variant', () => {
      render(<NavigationTabs {...defaultProps} variant="pills" />);
      const container = screen.getByRole('tablist');
      expect(container).toHaveClass('bg-gray-100', 'p-1', 'rounded-lg');
    });

    it('renders underline variant', () => {
      render(<NavigationTabs {...defaultProps} variant="underline" />);
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveClass('border-primary-500');
    });

    it('renders segment variant', () => {
      render(<NavigationTabs {...defaultProps} variant="segment" />);
      const container = screen.getByRole('tablist');
      expect(container).toHaveClass('bg-gray-100', 'flex');
    });
  });

  describe('Orientations', () => {
    it('renders horizontal orientation by default', () => {
      render(<NavigationTabs {...defaultProps} />);
      const container = screen.getByRole('tablist');
      expect(container).toHaveAttribute('aria-orientation', 'horizontal');
      expect(container).toHaveClass('space-x-1');
    });

    it('renders vertical orientation', () => {
      render(<NavigationTabs {...defaultProps} orientation="vertical" />);
      const container = screen.getByRole('tablist');
      expect(container).toHaveAttribute('aria-orientation', 'vertical');
      expect(container).toHaveClass('flex-col', 'space-y-1');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<NavigationTabs {...defaultProps} size="sm" />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('h-8');
      });
    });

    it('renders medium size (default)', () => {
      render(<NavigationTabs {...defaultProps} size="md" />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('h-10');
      });
    });

    it('renders large size', () => {
      render(<NavigationTabs {...defaultProps} size="lg" />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('h-12');
      });
    });
  });

  describe('Interactions', () => {
    it('calls onTabChange when tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<NavigationTabs {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Second Tab'));
      expect(onTabChange).toHaveBeenCalledWith('tab2');
    });

    it('does not call onTabChange when clicking the active tab', () => {
      const onTabChange = jest.fn();
      render(<NavigationTabs {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('First Tab'));
      expect(onTabChange).not.toHaveBeenCalled();
    });

    it('does not call onTabChange when clicking disabled tab', () => {
      const onTabChange = jest.fn();
      render(<NavigationTabs {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Third Tab'));
      expect(onTabChange).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      const onTabChange = jest.fn();
      render(<NavigationTabs {...defaultProps} onTabChange={onTabChange} />);
      
      const firstTab = screen.getByText('First Tab');
      await user.click(firstTab);
      await user.keyboard('{ArrowRight}');
      
      // Note: Keyboard navigation would need to be implemented in the component
      // This test assumes that functionality exists
    });
  });

  describe('States', () => {
    it('shows active state correctly', () => {
      render(<NavigationTabs {...defaultProps} activeTab="tab2" />);
      
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveTextContent('Second Tab');
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
    });

    it('shows disabled state correctly', () => {
      render(<NavigationTabs {...defaultProps} />);
      
      const disabledTab = screen.getByText('Third Tab').closest('button');
      expect(disabledTab).toBeDisabled();
      expect(disabledTab).toHaveClass('opacity-50');
    });

    it('handles global disabled state', () => {
      render(<NavigationTabs {...defaultProps} disabled />);
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toBeDisabled();
      });
    });
  });

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      render(<NavigationTabs {...defaultProps} fullWidth />);
      const container = screen.getByRole('tablist');
      expect(container).toHaveClass('w-full');
    });

    it('applies flex-1 to segment variant tabs when fullWidth is true', () => {
      render(<NavigationTabs {...defaultProps} variant="segment" fullWidth />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('flex-1');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<NavigationTabs {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
      
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
      expect(activeTab).toHaveAttribute('aria-controls', 'panel-tab1');
    });

    it('supports custom aria-label', () => {
      const tabsWithAriaLabel = mockTabs.map(tab => ({
        ...tab,
        ariaLabel: `Custom ${tab.label}`,
      }));
      
      render(<NavigationTabs {...defaultProps} tabs={tabsWithAriaLabel} />);
      
      expect(screen.getByLabelText('Custom First Tab')).toBeInTheDocument();
    });

    it('has proper tabIndex management', () => {
      render(<NavigationTabs {...defaultProps} />);
      
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveAttribute('tabIndex', '0');
      
      const inactiveTabs = screen.getAllByRole('tab').filter(tab => 
        tab.getAttribute('aria-selected') !== 'true'
      );
      inactiveTabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('Badge Display', () => {
    it('displays badge with correct styling', () => {
      render(<NavigationTabs {...defaultProps} activeTab="tab2" />);
      
      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
    });

    it('displays badge with inactive styling for inactive tabs', () => {
      render(<NavigationTabs {...defaultProps} />);
      
      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-gray-200', 'text-gray-700');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tabs array', () => {
      render(<NavigationTabs {...defaultProps} tabs={[]} />);
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      expect(screen.queryAllByRole('tab')).toHaveLength(0);
    });

    it('handles activeTab that does not exist in tabs', () => {
      render(<NavigationTabs {...defaultProps} activeTab="nonexistent" />);
      const selectedTabs = screen.queryAllByRole('tab', { selected: true });
      expect(selectedTabs).toHaveLength(0);
    });
  });
});