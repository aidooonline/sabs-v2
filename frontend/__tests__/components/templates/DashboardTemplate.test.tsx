import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardTemplate } from '../../../components/templates/DashboardTemplate';

describe('DashboardTemplate', () => {
  it('renders children content', () => {
    render(
      <DashboardTemplate>
        <div>Test content</div>
      </DashboardTemplate>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <DashboardTemplate title="Dashboard">
        <div>Content</div>
      </DashboardTemplate>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders with title and subtitle', () => {
    render(
      <DashboardTemplate title="Dashboard" subtitle="Overview of your data">
        <div>Content</div>
      </DashboardTemplate>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your data')).toBeInTheDocument();
  });

  it('renders with action buttons', () => {
    const actions = (
      <button type="button">Action Button</button>
    );

    render(
      <DashboardTemplate title="Dashboard" actions={actions}>
        <div>Content</div>
      </DashboardTemplate>
    );

    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <DashboardTemplate className="custom-class">
        <div>Content</div>
      </DashboardTemplate>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders without header when no title or actions provided', () => {
    render(
      <DashboardTemplate>
        <div>Content</div>
      </DashboardTemplate>
    );

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('applies fullWidth layout when specified', () => {
    const { container } = render(
      <DashboardTemplate title="Dashboard" fullWidth>
        <div>Content</div>
      </DashboardTemplate>
    );

    // Check that max-width constraint is not applied
    const headerContainer = container.querySelector('header > div');
    expect(headerContainer).not.toHaveClass('max-w-7xl');
  });

  it('applies constrained width by default', () => {
    const { container } = render(
      <DashboardTemplate title="Dashboard">
        <div>Content</div>
      </DashboardTemplate>
    );

    const headerContainer = container.querySelector('header > div');
    expect(headerContainer).toHaveClass('max-w-7xl');
  });

  it('renders with proper semantic structure', () => {
    render(
      <DashboardTemplate title="Dashboard">
        <div>Content</div>
      </DashboardTemplate>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
  });

  it('handles title truncation with long text', () => {
    const longTitle = 'This is a very long title that should be truncated when it exceeds the available space';
    
    render(
      <DashboardTemplate title={longTitle}>
        <div>Content</div>
      </DashboardTemplate>
    );

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass('truncate');
  });

  it('handles subtitle truncation with long text', () => {
    const longSubtitle = 'This is a very long subtitle that should be truncated when it exceeds the available space';
    
    render(
      <DashboardTemplate title="Dashboard" subtitle={longSubtitle}>
        <div>Content</div>
      </DashboardTemplate>
    );

    const subtitleElement = screen.getByText(longSubtitle);
    expect(subtitleElement).toHaveClass('truncate');
  });

  it('renders multiple action elements', () => {
    const actions = (
      <>
        <button type="button">Action 1</button>
        <button type="button">Action 2</button>
      </>
    );

    render(
      <DashboardTemplate title="Dashboard" actions={actions}>
        <div>Content</div>
      </DashboardTemplate>
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });
});