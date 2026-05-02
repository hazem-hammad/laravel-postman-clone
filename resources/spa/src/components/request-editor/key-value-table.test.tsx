import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyValueTable } from './key-value-table';

describe('KeyValueTable', () => {
  it('renders rows with their keys and values', () => {
    const onChange = vi.fn();
    render(
      <KeyValueTable
        rows={[{ key: 'Accept', value: 'application/json', disabled: false }]}
        onChange={onChange}
        placeholder="Header"
      />
    );

    expect(screen.getByDisplayValue('Accept')).toBeInTheDocument();
    expect(screen.getByDisplayValue('application/json')).toBeInTheDocument();
  });

  it('toggles a row disabled when checkbox is clicked', () => {
    const onChange = vi.fn();
    render(
      <KeyValueTable
        rows={[{ key: 'X', value: 'Y', disabled: false }]}
        onChange={onChange}
        placeholder="x"
      />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0];
    expect(next[0].disabled).toBe(true);
  });
});
