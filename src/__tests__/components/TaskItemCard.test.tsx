import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItemCard } from '../../components/todo/TaskItemCard';
import { AppProvider } from '../../context/AppContext';
import { Task } from '../../types';

describe('TaskItemCard Component', () => {
  const mockTask: Task = {
    id: 'test-task-1',
    title: 'Review Organic Chemistry Mechanism',
    completed: false,
    createdAt: '2025-01-01',
    priority: 'high',
    dueDate: '2025-01-02',
    subtasks: [],
  };

  it('renders task title and triggers onToggleTask when completion button is clicked', () => {
    const handleToggle = vi.fn();
    const handleSelect = vi.fn();

    render(
      <AppProvider>
        <TaskItemCard
          task={mockTask}
          isExpanded={false}
          onSelectTask={handleSelect}
          onToggleTask={handleToggle}
          onDeleteTask={vi.fn()}
          onEditTask={vi.fn()}
          onConvertTask={vi.fn()}
          onToggleSubtask={vi.fn()}
          onDeleteSubtask={vi.fn()}
          addingSubtaskForTaskId={null}
          setAddingSubtaskForTaskId={vi.fn()}
          subtaskTitle=""
          setSubtaskTitle={vi.fn()}
          subtaskDueDate=""
          setSubtaskDueDate={vi.fn()}
          subtaskRevision="none"
          setSubtaskRevision={vi.fn()}
          onSaveSubtask={vi.fn()}
          subjects={[]}
          onAddTaskUnderSubject={vi.fn()}
          creatingTaskUnderSubjectId={null}
          subjectTaskTitle=""
          setSubjectTaskTitle={vi.fn()}
          subjectTaskDueDate=""
          setSubjectTaskDueDate={vi.fn()}
          subjectTaskRevision="none"
          setSubjectTaskRevision={vi.fn()}
          onSaveTaskUnderSubject={vi.fn()}
          onCancelTaskUnderSubject={vi.fn()}
        />
      </AppProvider>
    );

    expect(screen.getByText('Review Organic Chemistry Mechanism')).toBeDefined();

    const checkBtn = screen.getByRole('button', { name: /mark complete/i });
    fireEvent.click(checkBtn);
    expect(handleToggle).toHaveBeenCalledWith('test-task-1');
  });

  it('triggers onSelectTask when task title area is clicked', () => {
    const handleSelect = vi.fn();

    render(
      <AppProvider>
        <TaskItemCard
          task={mockTask}
          isExpanded={false}
          onSelectTask={handleSelect}
          onToggleTask={vi.fn()}
          onDeleteTask={vi.fn()}
          onEditTask={vi.fn()}
          onConvertTask={vi.fn()}
          onToggleSubtask={vi.fn()}
          onDeleteSubtask={vi.fn()}
          addingSubtaskForTaskId={null}
          setAddingSubtaskForTaskId={vi.fn()}
          subtaskTitle=""
          setSubtaskTitle={vi.fn()}
          subtaskDueDate=""
          setSubtaskDueDate={vi.fn()}
          subtaskRevision="none"
          setSubtaskRevision={vi.fn()}
          onSaveSubtask={vi.fn()}
          subjects={[]}
          onAddTaskUnderSubject={vi.fn()}
          creatingTaskUnderSubjectId={null}
          subjectTaskTitle=""
          setSubjectTaskTitle={vi.fn()}
          subjectTaskDueDate=""
          setSubjectTaskDueDate={vi.fn()}
          subjectTaskRevision="none"
          setSubjectTaskRevision={vi.fn()}
          onSaveTaskUnderSubject={vi.fn()}
          onCancelTaskUnderSubject={vi.fn()}
        />
      </AppProvider>
    );

    fireEvent.click(screen.getByText('Review Organic Chemistry Mechanism'));
    expect(handleSelect).toHaveBeenCalledWith('test-task-1');
  });
});
