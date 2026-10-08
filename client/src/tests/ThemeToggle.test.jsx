import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

describe('ThemeToggle', () => {
  it('toggles the document root dark class on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const button = screen.getByRole('button');
    const wasDark = document.documentElement.classList.contains('dark');
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(!wasDark);
  });
});
