import React from 'react';
import {
  Check,
  Edit3,
  Trash2,
  GraduationCap,
  Plus,
  X,
  GripVertical,
} from 'lucide-react';
import { RevisionPlanType, Task } from '../../types';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/audio';
import { useApp } from '../../context/AppContext';
import { useLongPress } from '../../hooks/useLongPress';

export interface TaskItemCardProps {
  task: Task;
  isExpanded: boolean;
  onSelectTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string) => void;
  onConvertTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  addingSubtaskForTaskId: string | null;
  setAddingSubtaskForTaskId: (id: string | null) => void;
  subtaskTitle: string;
  setSubtaskTitle: (val: string) => void;
  subtaskDueDate: string;
  setSubtaskDueDate: (val: string) => void;
  subtaskRevision: RevisionPlanType;
  setSubtaskRevision: (val: RevisionPlanType) => void;
  onSaveSubtask: (taskId: string) => void;
  subjects: { id: string; name: string; color: string }[];
  onAddTaskUnderSubject: (subjectId: string) => void;
  creatingTaskUnderSubjectId: string | null;
  subjectTaskTitle: string;
  setSubjectTaskTitle: (val: string) => void;
  subjectTaskDueDate: string;
  setSubjectTaskDueDate: (val: string) => void;
  subjectTaskRevision: RevisionPlanType;
  setSubjectTaskRevision: (val: RevisionPlanType) => void;
  onSaveTaskUnderSubject: (subjectId: string) => void;
  onCancelTaskUnderSubject: () => void;
  onDragStart?: (taskId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (targetTaskId: string) => void;
  isDragging?: boolean;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  isExpanded,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onConvertTask,
  onToggleSubtask,
  onDeleteSubtask,
  addingSubtaskForTaskId,
  setAddingSubtaskForTaskId,
  subtaskTitle,
  setSubtaskTitle,
  subtaskDueDate,
  setSubtaskDueDate,
  subtaskRevision,
  setSubtaskRevision,
  onSaveSubtask,
  subjects,
  onAddTaskUnderSubject,
  creatingTaskUnderSubjectId,
  subjectTaskTitle,
  setSubjectTaskTitle,
  subjectTaskDueDate,
  setSubjectTaskDueDate,
  subjectTaskRevision,
  setSubjectTaskRevision,
  onSaveTaskUnderSubject,
  onCancelTaskUnderSubject,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}) => {
  const {
    openQuickActions,
    tasks,
    editSubject,
    deleteSubject,
    openModal,
    moveTaskUp,
    moveTaskDown,
    moveSubtaskUp,
    moveSubtaskDown,
  } = useApp();

  const isAddingSubtask = addingSubtaskForTaskId === task.id;
  const subject = subjects.find(s => s.id === task.subjectId);

  // Subtask Progress Calculation
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const subtaskPercent =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : task.completed
      ? 100
      : 0;

  // Subject Progress Calculation (Tasks completed under this subject)
  const subjectTasks = subject ? tasks.filter(t => t.subjectId === subject.id) : [];
  const subjectTotal = subjectTasks.length;
  const subjectCompleted = subjectTasks.filter(t => t.completed).length;
  const subjectPercent = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0;

  // Circular SVG ring properties for task checkbox (Radius = 11, Circumference ≈ 69.115)
  const ringRadius = 11;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (subtaskPercent / 100) * ringCircumference;

  // Circular mini ring properties for subject badge (Radius = 5.5, Circumference ≈ 34.55)
  const subRingRadius = 5.5;
  const subRingCircumference = 2 * Math.PI * subRingRadius;
  const subRingOffset = subRingCircumference - (subjectPercent / 100) * subRingCircumference;

  // Long-press handler for task card (Popup floating mode)
  const handleTaskLongPress = () => {
    openQuickActions({
      title: task.title,
      subtitle: `${subject?.name || 'Task'}${task.dueDate ? ` • Due ${formatFriendlyDate(task.dueDate)}` : ''}`,
      details: totalSubtasks > 0 ? `Subtasks: ${completedSubtasks}/${totalSubtasks} (${subtaskPercent}%)` : undefined,
      actions: [
        {
          id: 'move-up',
          label: 'Move Up',
          icon: 'up',
          onSelect: () => moveTaskUp(task.id),
        },
        {
          id: 'move-down',
          label: 'Move Down',
          icon: 'down',
          onSelect: () => moveTaskDown(task.id),
        },
        {
          id: 'edit-task',
          label: 'Edit Task',
          icon: 'edit',
          onSelect: () => onEditTask(task.id),
        },
        {
          id: 'toggle-task',
          label: task.completed ? 'Mark Incomplete' : 'Mark Completed',
          icon: 'check',
          onSelect: () => onToggleTask(task.id),
        },
        {
          id: 'convert-topic',
          label: 'Convert to Study Topic',
          icon: 'convert',
          onSelect: () => onConvertTask(task.id),
        },
        {
          id: 'del-task',
          label: 'Delete Task',
          icon: 'delete',
          danger: true,
          onSelect: () => onDeleteTask(task.id),
        },
      ],
    });
  };

  const taskLongPressEvents = useLongPress(handleTaskLongPress, { threshold: 480 });

  // Long-press handler for individual subtask (Popup floating mode)
  const handleSubtaskLongPress = (st: NonNullable<Task['subtasks']>[0]) => {
    openQuickActions({
      title: st.title,
      subtitle: `Subtask under "${task.title}"`,
      details: st.dueDate ? `Due: ${formatFriendlyDate(st.dueDate)}` : undefined,
      actions: [
        {
          id: 'move-sub-up',
          label: 'Move Up',
          icon: 'up',
          onSelect: () => moveSubtaskUp(task.id, st.id),
        },
        {
          id: 'move-sub-down',
          label: 'Move Down',
          icon: 'down',
          onSelect: () => moveSubtaskDown(task.id, st.id),
        },
        {
          id: 'toggle-sub',
          label: st.completed ? 'Mark Incomplete' : 'Mark Completed',
          icon: 'check',
          onSelect: () => onToggleSubtask(task.id, st.id),
        },
        {
          id: 'delete-sub',
          label: 'Delete Subtask',
          icon: 'delete',
          danger: true,
          onSelect: () => onDeleteSubtask(task.id, st.id),
        },
      ],
    });
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={() => {
        if (onDragStart) {
          triggerHaptic('medium');
          onDragStart(task.id);
        }
      }}
      onDragOver={e => {
        if (onDragOver) {
          e.preventDefault();
          onDragOver(e);
        }
      }}
      onDrop={e => {
        if (onDrop) {
          e.preventDefault();
          onDrop(task.id);
        }
      }}
      onContextMenu={e => {
        e.preventDefault();
        handleTaskLongPress();
      }}
      {...taskLongPressEvents}
      className={`rounded-2xl transition-all border select-none ${
        isDragging
          ? 'opacity-40 scale-[0.98] border-dashed border-blue-400'
          : isExpanded
          ? 'bg-white dark:bg-zinc-900 border-blue-500/30 shadow-md ring-1 ring-blue-500/20'
          : 'glass-item border-black/5 dark:border-white/5 hover:border-black/10'
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      {/* Task Main Row */}
      <div className="p-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          {/* Checkbox button with Subtle Circular Progress Ring */}
          <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              className="absolute inset-0 pointer-events-none"
            >
              {/* Background Track */}
              <circle
                cx="14"
                cy="14"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-black/10 dark:text-white/10"
              />
              {/* Animated Progress Arc */}
              <circle
                cx="14"
                cy="14"
                r={ringRadius}
                fill="none"
                stroke={
                  task.completed || subtaskPercent === 100
                    ? '#10B981'
                    : subtaskPercent > 0
                    ? '#3B82F6'
                    : 'transparent'
                }
                strokeWidth="2"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 14 14)"
                className="transition-all duration-400 ease-out"
              />
            </svg>

            {/* Centered Checkbox Button */}
            <button
              onClick={e => {
                e.stopPropagation();
                triggerHaptic(task.completed ? 'toggle' : 'success');
                onToggleTask(task.id);
              }}
              className={`w-4.5 h-4.5 rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90 z-10 ${
                task.completed
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white/80 dark:bg-zinc-800/80 hover:bg-blue-500/10'
              }`}
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </button>
          </div>

          {/* Task title & click trigger to expand details & subtasks */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onSelectTask(task.id);
            }}
            className="truncate flex items-center space-x-2 cursor-pointer flex-1 select-none"
          >
            <span
              className={`text-sm font-semibold tracking-tight truncate ${
                task.completed
                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {task.title}
            </span>

            {/* Subject Badge with Mini Circular Progress Ring */}
            {subject && (
              <span
                onClick={e => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  onAddTaskUnderSubject(subject.id);
                }}
                onContextMenu={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  openQuickActions({
                    title: subject.name,
                    subtitle: `${subjectCompleted}/${subjectTotal} tasks completed (${subjectPercent}%)`,
                    actions: [
                      {
                        id: 'add-under-sub',
                        label: `Add Task under ${subject.name}`,
                        icon: 'plus',
                        onSelect: () => onAddTaskUnderSubject(subject.id),
                      },
                      {
                        id: 'del-sub',
                        label: 'Delete Subject',
                        icon: 'delete',
                        danger: true,
                        onSelect: () => deleteSubject(subject.id),
                      },
                    ],
                  });
                }}
                className="inline-flex items-center space-x-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:scale-105 transition shrink-0"
                title={`Subject: ${subject.name} (${subjectPercent}% complete). Click to add task under it. Long-press for actions.`}
              >
                {/* Mini Circular Progress Ring for Subject */}
                <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" className="absolute inset-0">
                    <circle
                      cx="7"
                      cy="7"
                      r={subRingRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-black/10 dark:text-white/15"
                    />
                    <circle
                      cx="7"
                      cy="7"
                      r={subRingRadius}
                      fill="none"
                      stroke={subject.color}
                      strokeWidth="1.5"
                      strokeDasharray={subRingCircumference}
                      strokeDashoffset={subRingOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 7 7)"
                    />
                  </svg>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                </div>
                <span className="truncate max-w-[80px]">{subject.name}</span>
              </span>
            )}

            {/* Revision Badge if active */}
            {task.revisionPlan && task.revisionPlan !== 'none' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono shrink-0">
                {task.revisionPlan}
              </span>
            )}

            {/* Subtask micro count indicator */}
            {totalSubtasks > 0 && (
              <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                ({completedSubtasks}/{totalSubtasks})
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Icon: + icon on task creates sub task */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              if (!isExpanded) onSelectTask(task.id);
              setAddingSubtaskForTaskId(task.id);
            }}
            title="Create sub task"
            className="p-1 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Details: Notes, Subtasks, and Subject Task Creator */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-black/5 dark:border-white/5 space-y-3 animate-in fade-in duration-200">
          {/* Notes if present */}
          {task.notes && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic bg-black/5 dark:bg-white/5 p-2 rounded-xl">
              {task.notes}
            </p>
          )}

          {/* Subtasks Section (only if subtasks exist) */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <span className="text-[11px] uppercase tracking-wider">
                  Sub-tasks ({completedSubtasks}/{totalSubtasks})
                </span>
              </div>
              {task.subtasks.map(st => (
                <SubtaskRowItem
                  key={st.id}
                  st={st}
                  taskId={task.id}
                  onToggle={() => onToggleSubtask(task.id, st.id)}
                  onLongPress={() => handleSubtaskLongPress(st)}
                />
              ))}
            </div>
          )}

          {/* Quick Task Creation Directly Under Subject */}
          {subject && (
            <div className="pt-2 border-t border-black/5 dark:border-white/5">
              {creatingTaskUnderSubjectId === subject.id ? (
                <div className="p-2.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>New task under {subject.name}</span>
                    <button
                      type="button"
                      onClick={onCancelTaskUnderSubject}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={subjectTaskTitle}
                    onChange={e => setSubjectTaskTitle(e.target.value)}
                    placeholder={`Task title in ${subject.name}...`}
                    autoFocus
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-zinc-400 font-bold">Due:</span>
                      <input
                        type="date"
                        value={subjectTaskDueDate}
                        onChange={e => setSubjectTaskDueDate(e.target.value)}
                        className="bg-transparent text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-zinc-400 font-bold">Rev:</span>
                      <select
                        value={subjectTaskRevision}
                        onChange={e => setSubjectTaskRevision(e.target.value as RevisionPlanType)}
                        className="bg-transparent text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="none">None</option>
                        <option value="1-3-7-30">1-3-7-30</option>
                        <option value="1-7-14">1-7-14</option>
                        <option value="2-4-8">2-4-8</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('success');
                        onSaveTaskUnderSubject(subject.id);
                      }}
                      disabled={!subjectTaskTitle.trim()}
                      className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* --- Subtask Row Item Component with Touch & ContextMenu Long-Press --- */
const SubtaskRowItem: React.FC<{
  st: NonNullable<Task['subtasks']>[0];
  taskId: string;
  onToggle: () => void;
  onLongPress: () => void;
}> = ({ st, onToggle, onLongPress }) => {
  const timerRef = React.useRef<any>(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      triggerHaptic('medium');
      onLongPress();
    }, 450);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        cancelPress();
        onLongPress();
      }}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer select-none"
      title="Long-press to reorder or manage subtask"
    >
      <div
        onClick={e => {
          e.stopPropagation();
          triggerHaptic('toggle');
          onToggle();
        }}
        className="flex items-center space-x-2 flex-1 min-w-0"
      >
        <button
          type="button"
          className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
            st.completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-zinc-400 hover:border-blue-500'
          }`}
        >
          {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </button>
        <span
          className={`font-medium truncate ${
            st.completed
              ? 'line-through text-zinc-400 dark:text-zinc-500'
              : 'text-zinc-800 dark:text-zinc-200'
          }`}
        >
          {st.title}
        </span>

        {st.dueDate && (
          <span className="text-[10px] text-zinc-400 font-mono shrink-0">
            • {formatFriendlyDate(st.dueDate)}
          </span>
        )}

        {st.revisionPlan && st.revisionPlan !== 'none' && (
          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-500 font-bold shrink-0">
            {st.revisionPlan}
          </span>
        )}
      </div>
    </div>
  );
};
