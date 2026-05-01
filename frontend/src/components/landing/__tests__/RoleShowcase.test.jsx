import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoleShowcase from '../RoleShowcase';

// Mock the UI components
vi.mock('../../ui/ProfessionalCard', () => ({
  default: ({ children, className, onClick, variant }) => (
    <div 
      className={`professional-card ${className} ${variant}`} 
      onClick={onClick}
      data-testid="professional-card"
    >
      {children}
    </div>
  )
}));

vi.mock('../../ui/GradientButton', () => ({
  default: ({ children, className, icon, iconPosition }) => (
    <button className={`gradient-button ${className}`} data-testid="gradient-button">
      {children}
      {icon && <span data-testid="button-icon">{iconPosition}</span>}
    </button>
  )
}));

vi.mock('../../ui/AnimatedCounter', () => ({
  default: ({ end, suffix, prefix }) => (
    <span data-testid="animated-counter">
      {prefix}{end}{suffix}
    </span>
  )
}));

vi.mock('../../ui/LoadingSkeleton', () => ({
  default: ({ className }) => (
    <div className={`loading-skeleton ${className}`} data-testid="loading-skeleton" />
  )
}));

describe('RoleShowcase', () => {
  const mockStats = {
    users: {
      farmers: { total: 150, active: 120 },
      buyers: { total: 80, active: 65 },
      employees: { total: 25, active: 22 },
      total: 255
    }
  };

  it('renders without crashing', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    expect(screen.getByText('Built for Every')).toBeInTheDocument();
    expect(screen.getByText('Stakeholder')).toBeInTheDocument();
  });

  it('displays all role cards', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Use getAllByText to handle multiple instances
    const farmerElements = screen.getAllByText('Farmers');
    expect(farmerElements.length).toBeGreaterThan(0);
    
    expect(screen.getByText('Buyers')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Administrators')).toBeInTheDocument();
  });

  it('shows farmer role as default active', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Check if farmer details are shown
    expect(screen.getByText('Streamline milk collection and animal management')).toBeInTheDocument();
    expect(screen.getByText('Digital milk entry with instant calculations')).toBeInTheDocument();
  });

  it('switches active role when clicking different role cards', async () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Click on Buyers role
    const buyerCard = screen.getByText('Buyers').closest('[data-testid="professional-card"]');
    fireEvent.click(buyerCard);
    
    await waitFor(() => {
      expect(screen.getByText('Manage orders and home delivery efficiently')).toBeInTheDocument();
      expect(screen.getByText('Easy online milk ordering system')).toBeInTheDocument();
    });
  });

  it('displays loading skeletons when loading is true', () => {
    render(<RoleShowcase stats={mockStats} loading={true} />);
    
    const skeletons = screen.getAllByTestId('loading-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays animated counters with correct stats', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Check for animated counters in the default farmer role
    const counters = screen.getAllByTestId('animated-counter');
    expect(counters.length).toBeGreaterThan(0);
    
    // Check if farmer stats are displayed
    expect(screen.getByText('150 users')).toBeInTheDocument();
  });

  it('shows role-specific features for each role', async () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Test farmer features (default)
    expect(screen.getByText('Digital milk entry with instant calculations')).toBeInTheDocument();
    expect(screen.getByText('Animal health tracking and management')).toBeInTheDocument();
    
    // Switch to buyer and test buyer features
    const buyerCard = screen.getByText('Buyers').closest('[data-testid="professional-card"]');
    fireEvent.click(buyerCard);
    
    await waitFor(() => {
      expect(screen.getByText('Easy online milk ordering system')).toBeInTheDocument();
      expect(screen.getByText('Flexible delivery scheduling')).toBeInTheDocument();
    });
  });

  it('displays role-specific benefits', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Check for farmer benefits (default active role)
    expect(screen.getByText('Increase income by 25%')).toBeInTheDocument();
    expect(screen.getByText('Save 2 hours daily')).toBeInTheDocument();
    expect(screen.getByText('100% accurate payments')).toBeInTheDocument();
  });

  it('shows growth percentages for each role', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Check for growth indicators - use getAllByText since it appears in multiple places
    const growthElements = screen.getAllByText('+12%');
    expect(growthElements.length).toBeGreaterThan(0);
  });

  it('renders CTA buttons', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    const ctaButton = screen.getByTestId('gradient-button');
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveTextContent('Get Started as Farmer');
    
    const learnMoreButton = screen.getByText('Learn More');
    expect(learnMoreButton).toBeInTheDocument();
  });

  it('handles missing stats gracefully', () => {
    render(<RoleShowcase stats={null} loading={false} />);
    
    // Should still render without crashing
    expect(screen.getByText('Built for Every')).toBeInTheDocument();
    
    // Should show 0 for missing stats
    const counters = screen.getAllByTestId('animated-counter');
    expect(counters.some(counter => counter.textContent.includes('0'))).toBe(true);
  });

  it('applies correct styling classes', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Use querySelector to find the section element
    const section = document.querySelector('section');
    expect(section).toHaveClass('bg-gradient-to-br', 'from-gray-900', 'via-blue-900', 'to-purple-900');
  });

  it('shows correct role statistics in detail view', async () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Check farmer stats (default)
    expect(screen.getByText('150')).toBeInTheDocument(); // Total users
    expect(screen.getByText('120')).toBeInTheDocument(); // Active users
    
    // Switch to buyers and check buyer stats
    const buyerCard = screen.getByText('Buyers').closest('[data-testid="professional-card"]');
    fireEvent.click(buyerCard);
    
    await waitFor(() => {
      expect(screen.getByText('80')).toBeInTheDocument(); // Buyer total
      expect(screen.getByText('65')).toBeInTheDocument(); // Buyer active
    });
  });

  it('maintains accessibility standards', () => {
    render(<RoleShowcase stats={mockStats} loading={false} />);
    
    // Check for proper heading structure
    const mainHeading = screen.getByText('Built for Every');
    expect(mainHeading.tagName).toBe('H2');
    
    // Check for proper button accessibility
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // All buttons should be focusable
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });
});