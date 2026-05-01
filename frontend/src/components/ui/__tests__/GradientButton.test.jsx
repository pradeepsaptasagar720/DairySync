import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { User } from 'lucide-react';
import GradientButton from '../GradientButton';

describe('GradientButton', () => {
  it('renders children correctly', () => {
    render(<GradientButton>Click me</GradientButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<GradientButton>Button</GradientButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700');
  });

  it('applies secondary variant correctly', () => {
    render(<GradientButton variant="secondary">Button</GradientButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('from-green-600', 'to-green-700');
  });

  it('shows loading spinner when loading', () => {
    render(<GradientButton loading={true}>Button</GradientButton>);
    expect(screen.getByTestId('loader-icon') || document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<GradientButton loading={true}>Button</GradientButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<GradientButton disabled={true}>Button</GradientButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders icon on the left by default', () => {
    render(<GradientButton icon={User}>Button</GradientButton>);
    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('mr-2');
  });

  it('renders icon on the right when specified', () => {
    render(<GradientButton icon={User} iconPosition="right">Button</GradientButton>);
    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toHaveClass('ml-2');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<GradientButton onClick={handleClick}>Button</GradientButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<GradientButton size="sm">Button</GradientButton>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm');

    rerender(<GradientButton size="lg">Button</GradientButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
  });

  it('applies custom className', () => {
    render(<GradientButton className="custom-class">Button</GradientButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});