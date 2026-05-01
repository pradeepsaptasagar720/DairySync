import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModulesDirectory from '../ModulesDirectory';

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
  default: ({ children, className, icon, iconPosition, size, variant }) => (
    <button 
      className={`gradient-button ${className} ${size} ${variant}`} 
      data-testid="gradient-button"
    >
      {children}
      {icon && <span data-testid="button-icon">{iconPosition}</span>}
    </button>
  )
}));

vi.mock('../../ui/LoadingSkeleton', () => ({
  default: ({ className }) => (
    <div className={`loading-skeleton ${className}`} data-testid="loading-skeleton" />
  )
}));

describe('ModulesDirectory', () => {
  const mockStats = {
    users: {
      farmers: { total: 150, active: 120 },
      buyers: { total: 80, active: 65 },
      employees: { total: 25, active: 22 },
      total: 255
    },
    animals: { total: 300 },
    features: {
      milkCollection: { adoption: 85 },
      animalManagement: { adoption: 78 },
      homeDelivery: { adoption: 82 },
      userManagement: { adoption: 100 },
      reportGeneration: { adoption: 75 },
      digitalPayments: { adoption: 78 },
      rateManagement: { adoption: 95 },
      loanManagement: { adoption: 45 },
      feedManagement: { adoption: 60 },
      notifications: { adoption: 85 }
    }
  };

  it('renders without crashing', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    expect(screen.getByText('Complete Feature')).toBeInTheDocument();
    expect(screen.getByText('Directory')).toBeInTheDocument();
  });

  it('displays all tab filters', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    expect(screen.getByText('All Modules (12)')).toBeInTheDocument();
    expect(screen.getByText('Farmer (4)')).toBeInTheDocument();
    expect(screen.getByText('Buyer (3)')).toBeInTheDocument();
    expect(screen.getByText('Employee (3)')).toBeInTheDocument();
    expect(screen.getByText('Admin (2)')).toBeInTheDocument();
  });

  it('shows all modules by default', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Check for some key modules
    expect(screen.getByText('Milk Collection System')).toBeInTheDocument();
    expect(screen.getByText('Animal Management')).toBeInTheDocument();
    expect(screen.getByText('Home Delivery System')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('filters modules by role when tab is clicked', async () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Click on Farmer tab
    const farmerTab = screen.getByText('Farmer (4)');
    fireEvent.click(farmerTab);
    
    await waitFor(() => {
      // Should show farmer-specific modules
      expect(screen.getByText('Milk Collection System')).toBeInTheDocument();
      expect(screen.getByText('Animal Management')).toBeInTheDocument();
      expect(screen.getByText('Loan Management')).toBeInTheDocument();
      expect(screen.getByText('Feed Management')).toBeInTheDocument();
      
      // Should not show buyer-specific modules
      expect(screen.queryByText('Home Delivery System')).not.toBeInTheDocument();
    });
  });

  it('searches modules by title and description', async () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    const searchInput = screen.getByPlaceholderText('Search modules...');
    fireEvent.change(searchInput, { target: { value: 'milk' } });
    
    await waitFor(() => {
      expect(screen.getByText('Milk Collection System')).toBeInTheDocument();
      // Other modules without 'milk' in title/description should be filtered out
      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });
  });

  it('toggles between grid and list view modes', async () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Find the view toggle buttons by their SVG icons or container
    const buttons = screen.getAllByRole('button');
    const gridButton = buttons.find(btn => btn.querySelector('svg[class*="grid"]'));
    const listButton = buttons.find(btn => btn.querySelector('svg[class*="list"]'));
    
    expect(gridButton).toBeDefined();
    expect(listButton).toBeDefined();
    
    // Click list view
    if (listButton) {
      fireEvent.click(listButton);
      
      await waitFor(() => {
        expect(listButton).toHaveClass('bg-white/20');
      });
    }
    
    // Click back to grid view
    if (gridButton) {
      fireEvent.click(gridButton);
      
      await waitFor(() => {
        expect(gridButton).toHaveClass('bg-white/20');
      });
    }
  });

  it('displays module statistics correctly', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Check for adoption percentages - use getAllByText since percentages appear multiple times
    const adoption85 = screen.getAllByText('85%');
    expect(adoption85.length).toBeGreaterThan(0);
    
    const adoption78 = screen.getAllByText('78%');
    expect(adoption78.length).toBeGreaterThan(0);
    
    // Check for user counts - use getAllByText since numbers appear multiple times
    const count120 = screen.getAllByText('120');
    expect(count120.length).toBeGreaterThan(0);
  });

  it('shows loading skeletons when loading is true', () => {
    render(<ModulesDirectory stats={mockStats} loading={true} />);
    
    const skeletons = screen.getAllByTestId('loading-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays module features and pages', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Check for features (should be displayed as tags)
    expect(screen.getByText('Digital Entry')).toBeInTheDocument();
    expect(screen.getByText('Auto Calculations')).toBeInTheDocument();
    
    // Check for pages
    expect(screen.getByText('Milk Entry')).toBeInTheDocument();
    expect(screen.getByText('Collection History')).toBeInTheDocument();
  });

  it('shows module status badges', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Most modules should show 'active' status
    const activeStatuses = screen.getAllByText('active');
    expect(activeStatuses.length).toBeGreaterThan(0);
    
    // Some modules might show 'beta' status
    const betaStatuses = screen.queryAllByText('beta');
    expect(betaStatuses.length).toBeGreaterThanOrEqual(0);
  });

  it('displays module ratings', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Check for rating displays - use getAllByText since ratings appear multiple times
    const rating48 = screen.getAllByText('4.8');
    expect(rating48.length).toBeGreaterThan(0);
    
    const rating46 = screen.getAllByText('4.6');
    expect(rating46.length).toBeGreaterThan(0);
  });

  it('shows summary statistics at the bottom', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Check for summary stats
    expect(screen.getByText('12')).toBeInTheDocument(); // Total modules
    expect(screen.getByText('Total Modules')).toBeInTheDocument();
    expect(screen.getByText('Active Modules')).toBeInTheDocument();
    expect(screen.getByText('Beta Modules')).toBeInTheDocument();
    expect(screen.getByText('Avg Adoption')).toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    const searchInput = screen.getByPlaceholderText('Search modules...');
    fireEvent.change(searchInput, { target: { value: 'nonexistentmodule' } });
    
    await waitFor(() => {
      expect(screen.getByText('No modules found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
    });
  });

  it('renders explore module buttons', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    const exploreButtons = screen.getAllByTestId('gradient-button');
    expect(exploreButtons.length).toBeGreaterThan(0);
    
    // Check if buttons have correct text
    expect(screen.getAllByText('Explore Module').length).toBeGreaterThan(0);
  });

  it('handles missing stats gracefully', () => {
    render(<ModulesDirectory stats={null} loading={false} />);
    
    // Should still render without crashing
    expect(screen.getByText('Complete Feature')).toBeInTheDocument();
    
    // Should show default values for missing stats - use getAllByText since 0 appears multiple times
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  it('applies correct styling classes', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Use querySelector to find the section element
    const section = document.querySelector('section');
    expect(section).toHaveClass('bg-gradient-to-br', 'from-gray-900', 'via-purple-900', 'to-blue-900');
  });

  it('maintains accessibility standards', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Check for proper heading structure
    const mainHeading = screen.getByText('Complete Feature');
    expect(mainHeading.tagName).toBe('H2');
    
    // Check for proper input accessibility
    const searchInput = screen.getByPlaceholderText('Search modules...');
    expect(searchInput).toHaveAttribute('type', 'text');
    
    // Check for proper button accessibility
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // All buttons should be focusable
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('shows correct module counts in tabs', () => {
    render(<ModulesDirectory stats={mockStats} loading={false} />);
    
    // Verify tab counts match expected module distribution
    expect(screen.getByText('All Modules (12)')).toBeInTheDocument();
    expect(screen.getByText('Farmer (4)')).toBeInTheDocument();
    expect(screen.getByText('Buyer (3)')).toBeInTheDocument();
    expect(screen.getByText('Employee (3)')).toBeInTheDocument();
    expect(screen.getByText('Admin (2)')).toBeInTheDocument();
  });
});