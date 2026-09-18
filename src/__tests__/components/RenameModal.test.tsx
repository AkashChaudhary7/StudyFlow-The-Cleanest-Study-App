import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RenameModal } from '../../components/todo/RenameModal';

describe('RenameModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <RenameModal
        isOpen={false}
        title="Rename List"
        initialValue="Work"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders with initialValue and submits new trimmed value on form submission', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <RenameModal
        isOpen={true}
        title="Rename Subject"
        initialValue="Biology"
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Rename Subject')).toBeDefined();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Biology');

    fireEvent.change(input, { target: { value: '  Biochemistry  ' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(handleSave).toHaveBeenCalledWith('Biochemistry');
    expect(handleClose).toHaveBeenCalled();
  });
});
