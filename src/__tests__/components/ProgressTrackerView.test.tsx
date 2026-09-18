import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressTrackerView } from '../../components/todo/ProgressTrackerView';
import { Task } from '../../types';

describe('ProgressTrackerView Component', () => {
  it('renders placeholder when no revision tasks exist', () => {
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Regular task',
        completed: false,
        createdAt: '2025-01-01',
        revisionPlan: 'none',
        priority: 'none',
        subtasks: [],
      },
    ];
    render(
      <ProgressTrackerView
        listId="default"
        listName="Default"
        tasks={tasks}
        onToggleStep={vi.fn()}
      />
    );
    expect(screen.getByText(/No revision tasks in this list/i)).toBeDefined();
  });

  it('renders tracked tasks with step buttons and handles step click', () => {
    const handleToggleStep = vi.fn();
    const tasks: Task[] = [
      {
        id: 'task-rev-1',
        title: 'Learn Fourier Transform',
        completed: false,
        createdAt: '2025-01-01',
        revisionPlan: '3x',
        completedRevisions: [1],
        priority: 'high',
        subtasks: [],
      },
    ];

    render(
      <ProgressTrackerView
        listId="default"
        listName="Default"
        tasks={tasks}
        onToggleStep={handleToggleStep}
      />
    );

    expect(screen.getByText('Learn Fourier Transform')).toBeDefined();
    expect(screen.getByText('1x')).toBeDefined();
    expect(screen.getByText('2x')).toBeDefined();
    expect(screen.getByText('3x')).toBeDefined();

    // Click step 2
    fireEvent.click(screen.getByText('2x'));
    expect(handleToggleStep).toHaveBeenCalledWith('task-rev-1', 2);
  });
});
