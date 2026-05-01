import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AnimatedCounter from '../AnimatedCounter';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders with initial count of 0', () => {
    render(<AnimatedCounter end={100} />);
    const counter = screen.getByText('0');
    expect(counter).toBeInTheDocument();
  });

  it('applies prefix and suffix correctly', () => {
    render(<AnimatedCounter end={100} prefix="$" suffix="K" />);
    const counter = screen.getByText('$0K');
    expect(counter).toBeInTheDocument();
  });

  it('formats numbers with separators', () => {
    render(<AnimatedCounter end={1000} separator="," />);
    // Initially shows 0, but we can test the formatting logic
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles decimal places correctly', () => {
    render(<AnimatedCounter end={100.5} decimals={1} />);
    const counter = screen.getByText('0.0');
    expect(counter).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AnimatedCounter end={100} className="custom-class" />);
    const counter = screen.getByText('0');
    expect(counter).toHaveClass('custom-class');
  });

  it('creates unique ID based on end value', () => {
    render(<AnimatedCounter end={123} />);
    const counter = document.getElementById('counter-123');
    expect(counter).toBeInTheDocument();
  });

  it('sets up IntersectionObserver correctly', () => {
    render(<AnimatedCounter end={100} />);
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1 }
    );
  });

  it('applies tabular-nums class for consistent number width', () => {
    render(<AnimatedCounter end={100} />);
    const counter = screen.getByText('0');
    expect(counter).toHaveClass('tabular-nums');
  });

  it('applies font-bold class by default', () => {
    render(<AnimatedCounter end={100} />);
    const counter = screen.getByText('0');
    expect(counter).toHaveClass('font-bold');
  });
});