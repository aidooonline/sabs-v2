import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  CardTitle, 
  CardDescription,
  LoadingCard,
  EmptyCard 
} from '../../../components/atoms/Card';

describe('Card Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Card>Test content</Card>);
      const card = screen.getByText('Test content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white');
    });

    it('renders with custom className', () => {
      render(<Card className="custom-class">Test</Card>);
      const card = screen.getByText('Test').closest('div');
      expect(card).toHaveClass('custom-class');
    });

    it('renders children correctly', () => {
      render(<Card>Custom content</Card>);
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  // Variant tests
  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Card variant="default">Default</Card>);
      const card = screen.getByText('Default').closest('div');
      expect(card).toHaveClass('bg-white', 'border', 'border-gray-200');
    });

    it('renders outlined variant', () => {
      render(<Card variant="outlined">Outlined</Card>);
      const card = screen.getByText('Outlined').closest('div');
      expect(card).toHaveClass('border-2', 'border-gray-300');
    });

    it('renders elevated variant', () => {
      render(<Card variant="elevated">Elevated</Card>);
      const card = screen.getByText('Elevated').closest('div');
      expect(card).toHaveClass('shadow-md');
    });

    it('renders filled variant', () => {
      render(<Card variant="filled">Filled</Card>);
      const card = screen.getByText('Filled').closest('div');
      expect(card).toHaveClass('bg-gray-50');
    });

    it('renders ghost variant', () => {
      render(<Card variant="ghost">Ghost</Card>);
      const card = screen.getByText('Ghost').closest('div');
      expect(card).toHaveClass('bg-transparent');
    });
  });

  // Interactive tests
  describe('Interactive', () => {
    it('handles click events when interactive', () => {
      const handleClick = jest.fn();
      render(
        <Card onClick={handleClick} interactive>
          Clickable Card
        </Card>
      );
      
      const card = screen.getByText('Clickable Card').closest('div');
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveAttribute('role', 'button');
      
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Card onClick={handleClick} interactive>
          Keyboard Card
        </Card>
      );
      
      const card = screen.getByText('Keyboard Card').closest('div');
      expect(card).toHaveAttribute('tabIndex', '0');
      
      // Test Enter key
      card!.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('does not show interactive styles when not interactive', () => {
      render(<Card>Non-interactive Card</Card>);
      const card = screen.getByText('Non-interactive Card').closest('div');
      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveAttribute('role', 'button');
    });
  });

  // State tests
  describe('States', () => {
    it('handles loading state', () => {
      render(<Card loading>Loading Card</Card>);
      const card = screen.getByText('Loading Card').closest('div');
      expect(card).toHaveClass('animate-pulse');
    });

    it('handles selected state', () => {
      render(<Card selected>Selected Card</Card>);
      const card = screen.getByText('Selected Card').closest('div');
      expect(card).toHaveClass('ring-2', 'ring-primary-500');
    });
  });
});

describe('Card Sub-components', () => {
  describe('CardHeader', () => {
    it('renders header correctly', () => {
      render(<CardHeader>Header Content</CardHeader>);
      const header = screen.getByText('Header Content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('px-6', 'py-4', 'border-b');
    });
  });

  describe('CardBody', () => {
    it('renders body correctly', () => {
      render(<CardBody>Body Content</CardBody>);
      const body = screen.getByText('Body Content');
      expect(body).toBeInTheDocument();
      expect(body).toHaveClass('px-6', 'py-4');
    });
  });

  describe('CardFooter', () => {
    it('renders footer correctly', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      const footer = screen.getByText('Footer Content');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('px-6', 'py-4', 'border-t');
    });
  });

  describe('CardTitle', () => {
    it('renders title correctly', () => {
      render(<CardTitle>Title Text</CardTitle>);
      const title = screen.getByText('Title Text');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });
  });

  describe('CardDescription', () => {
    it('renders description correctly', () => {
      render(<CardDescription>Description text</CardDescription>);
      const description = screen.getByText('Description text');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-gray-600');
    });
  });
});

describe('Specialized Card Components', () => {
  describe('LoadingCard', () => {
    it('renders loading card with skeleton', () => {
      render(<LoadingCard />);
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('accepts custom className', () => {
      render(<LoadingCard className="custom-loading" />);
      const card = document.querySelector('.custom-loading');
      expect(card).toBeInTheDocument();
    });
  });

  describe('EmptyCard', () => {
    it('renders with default empty state', () => {
      render(<EmptyCard />);
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByText('There is no data to display')).toBeInTheDocument();
    });

    it('renders with custom title and description', () => {
      render(
        <EmptyCard 
          title="Custom Title" 
          description="Custom description text" 
        />
      );
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('renders with action button', () => {
      const actionButton = <button>Add New Item</button>;
      render(<EmptyCard action={actionButton} />);
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
    });
  });
});

describe('Compound Card Usage', () => {
  it('renders full card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Full Card</CardTitle>
          <CardDescription>Complete card example</CardDescription>
        </CardHeader>
        <CardBody>
          <p>This is the main content of the card.</p>
        </CardBody>
        <CardFooter>
          <button>Action Button</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Full Card')).toBeInTheDocument();
    expect(screen.getByText('Complete card example')).toBeInTheDocument();
    expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('has proper button role when interactive', () => {
    render(
      <Card onClick={() => {}} interactive aria-label="Interactive card">
        Accessible Card
      </Card>
    );
    
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-label', 'Interactive card');
  });

  it('supports keyboard navigation', () => {
    render(
      <Card onClick={() => {}} interactive>
        Keyboard accessible
      </Card>
    );
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('does not have button role when not interactive', () => {
    render(<Card>Non-interactive</Card>);
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });
});