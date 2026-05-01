import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfessionalCard from '../ProfessionalCard';

describe('ProfessionalCard', () => {
  it('renders children correctly', () => {
    render(
      <ProfessionalCard>
        <div>Test content</div>
      </ProfessionalCard>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(
      <ProfessionalCard>Content</ProfessionalCard>
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white', 'shadow-lg', 'border', 'border-gray-100');
  });

  it('applies glassmorphism variant correctly', () => {
    const { container } = render(
      <ProfessionalCard variant="glassmorphism">Content</ProfessionalCard>
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white/10', 'backdrop-blur-md', 'border-white/20');
  });

  it('applies hover effects when enabled', () => {
    const { container } = render(
      <ProfessionalCard hover={true}>Content</ProfessionalCard>
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-2xl', 'hover:-translate-y-1');
  });

  it('does not apply hover effects when disabled', () => {
    const { container } = render(
      <ProfessionalCard hover={false}>Content</ProfessionalCard>
    );
    
    const card = container.firstChild;
    expect(card).not.toHaveClass('hover:shadow-2xl');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProfessionalCard className="custom-class">Content</ProfessionalCard>
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <ProfessionalCard ref={ref}>Content</ProfessionalCard>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});