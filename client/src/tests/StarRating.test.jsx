import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from '../components/StarRating.jsx';

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating value={3} readOnly />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('calls onChange with the clicked star value', () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} />);
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[3]); // 4th star, 1-indexed value = 4
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange when readOnly', () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} readOnly />);
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
