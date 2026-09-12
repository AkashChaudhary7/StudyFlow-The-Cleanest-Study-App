import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getTodayStr,
  addDays,
  isPastDate,
  isTodayDate,
} from '../../utils/dateUtils';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  X,
  RefreshCw,
  FolderPlus,
  Folder,
  CheckCircle2,
  PenLine,
} from 'lucide-react';
import { RevisionPlanType, Task, Subject } from '../../types';
import { triggerHaptic } from '../../utils/audio';
import { TaskItemCard } from './TaskItemCard';
import { ProgressTrackerView } from './ProgressTrackerView';

export const TodoSection: React.FC = () => {
  const {
    tasks,
    subjects,
    addSubject,
    editSubject,
    deleteSubject,
    customLists,
    activeListId,
    setActiveListId,
    addCustomList,
    deleteCustomList,
    moveCustomListUp,
    moveCustomListDown,
    addTask,
    editTask,
    deleteTask,
    reorderTasks,
    toggleTaskCompleted,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    setConvertingTaskId,
    setEditingTaskId,
    openModal,
    openCreateTaskModal,
    addRevisionInstance,
    openQuickActions,
    renameCustomList,
    quickNotes,
    toggleTaskRevisionStep,
    duplicateCustomList,
    copyListTasksToClipboard,
  } = useApp();

  const today = getTodayStr();
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7);

  // Clean Custom List creator modal / inline state
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Folder Collapsed States for 'Task Due'
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({
    completed: true, // completed collapsed by default
  });

  // Active expanded task ID (clicking a task expands subtasks & options)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Inline subtask creation state for a specific task
  const [addingSubtaskForTaskId, setAddingSubtaskForTaskId] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDueDate, setSubtaskDueDate] = useState<string>(today);
  const [subtaskRevision, setSubtaskRevision] = useState<RevisionPlanType>('none');

  // Inline task creation directly under a subject
  const [creatingTaskUnderSubjectId, setCreatingTaskUnderSubjectId] = useState<string | null>(null);
  const [subjectTaskTitle, setSubjectTaskTitle] = useState('');
  const [subjectTaskDueDate, setSubjectTaskDueDate] = useState<string>(today);
  const [subjectTaskRevision, setSubjectTaskRevision] = useState<RevisionPlanType>('none');

  // Drag-and-drop sortable state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Swipe-down / Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Separated Progress Tracker view selection toggle (beside active count)
  const [isTrackerView, setIsTrackerView] = useState(false);

  // Group by schedule vs subject in Task Due
  const [taskDueGroupBy, setTaskDueGroupBy] = useState<'schedule' | 'subject'>('schedule');

  // Folders order for Task Due
  const [folderOrder, setFolderOrder] = useState<string[]>([
    'today',
    'tomorrow',
    'thisWeek',
    'later',
    'completed',
  ]);

  const moveFolderUp = (key: string) => {
    setFolderOrder(prev => {
      const idx = prev.indexOf(key);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      triggerHaptic('light');
      return next;
    });
  };

  const moveFolderDown = (key: string) => {
    setFolderOrder(prev => {
      const idx = prev.indexOf(key);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      triggerHaptic('light');
      return next;
    });
  };

  const toggleFolder = (folderKey: string) => {
    triggerHaptic('light');
    setCollapsedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    triggerHaptic('success');
    const palette = ['#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF2D55', '#5856D6', '#30B0C7'];
    const randomColor = palette[Math.floor(Math.random() * palette.length)];
    const newSub = addSubject(newListName.trim(), randomColor);
    setActiveListId(newSub.id);
    setNewListName('');
    setIsCreatingList(false);
  };

  // Handle Add Subtask under a task
  const handleSaveSubtask = (taskId: string) => {
    if (!subtaskTitle.trim()) return;
    addSubtask(taskId, {
      title: subtaskTitle.trim(),
      dueDate: subtaskDueDate || undefined,
      revisionPlan: subtaskRevision !== 'none' ? subtaskRevision : undefined,
    });
    setSubtaskTitle('');
    setAddingSubtaskForTaskId(null);
  };

  // Handle Add Task under a subject directly
  const handleSaveTaskUnderSubject = (subjectId: string) => {
    if (!subjectTaskTitle.trim()) return;
    const created = addTask({
      title: subjectTaskTitle.trim(),
      dueDate: subjectTaskDueDate || undefined,
      priority: 'none',
      completed: false,
      subjectId,
      revisionPlan: subjectTaskRevision !== 'none' ? subjectTaskRevision : undefined,
      listId: activeListId !== 'all' ? activeListId : undefined,
      subtasks: [],
    });

    if (subjectTaskRevision !== 'none') {
      addRevisionInstance({
        topicId: `task-rev-${created.id}`,
        subjectId,
        revisionNumber: 1,
        scheduledDate: addDays(subjectTaskDueDate || today, 1),
        status: 'pending',
        notes: `Revision for task: ${created.title}`,
      });
    }

    setSubjectTaskTitle('');
    setCreatingTaskUnderSubjectId(null);
  };

  // Filter tasks based on active custom list or subject
  const activeCustomList = customLists.find(l => l.id === activeListId);
  const activeSubject = subjects.find(s => s.id === activeListId);
  const isAllView = activeListId === 'all';
  const isDailyView = activeListId === 'daily';

  const currentListTasks = useMemo(() => {
    if (activeListId === 'all') {
      return tasks;
    }
    if (activeListId === 'daily') {
      return tasks.filter(
        t => t.recurring === 'daily' || t.dueDate === today || (t.recurring && t.recurring !== 'none')
      );
    }
    if (activeSubject) {
      return tasks.filter(t => t.subjectId === activeSubject.id);
    }
    return tasks.filter(t => t.listId === activeListId);
  }, [tasks, activeListId, today, activeSubject]);

  // Grouping into Apple-style Folders for Task Due: Today, Tomorrow, This Week, Later, Completed
  const groupedSchedule = useMemo(() => {
    const todayTasks: Task[] = [];
    const tomorrowTasks: Task[] = [];
    const weekTasks: Task[] = [];
    const laterTasks: Task[] = [];
    const completedTasks: Task[] = [];

    currentListTasks.forEach(task => {
      if (task.completed) {
        completedTasks.push(task);
        return;
      }

      if (!task.dueDate) {
        laterTasks.push(task);
        return;
      }

      if (isPastDate(task.dueDate) || isTodayDate(task.dueDate)) {
        todayTasks.push(task);
      } else if (task.dueDate === tomorrow) {
        tomorrowTasks.push(task);
      } else if (task.dueDate <= weekEnd) {
        weekTasks.push(task);
      } else {
        laterTasks.push(task);
      }
    });

    return {
      today: todayTasks,
      tomorrow: tomorrowTasks,
      thisWeek: weekTasks,
      later: laterTasks,
      completed: completedTasks,
    };
  }, [currentListTasks, tomorrow, weekEnd]);

  const currentListName = isAllView
    ? 'Task Due'
    : isDailyView
    ? 'Daily Task'
    : activeSubject
    ? activeSubject.name
    : activeCustomList?.name || 'Custom List';

  // Drag-and-drop sortable handler
  const handleDrop = (targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      return;
    }

    const currentItems = [...tasks];
    const fromIndex = currentItems.findIndex(t => t.id === draggedTaskId);
    const toIndex = currentItems.findIndex(t => t.id === targetTaskId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = currentItems.splice(fromIndex, 1);
      currentItems.splice(toIndex, 0, moved);
      reorderTasks(currentItems);
      triggerHaptic('medium');
    }

    setDraggedTaskId(null);
  };

  // Pull-to-refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 5) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      // Apply rubberband damping
      setPullDistance(Math.min(diff * 0.4, 75));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 45) {
      setIsRefreshing(true);
      triggerHaptic('success');
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        touchStartY.current = null;
      }, 600);
    } else {
      setPullDistance(0);
      touchStartY.current = null;
    }
  };

  // Common task item props
  const getTaskItemProps = (task: Task) => ({
    task,
    isExpanded: expandedTaskId === task.id,
    onSelectTask: (id: string) => setExpandedTaskId(prev => (prev === id ? null : id)),
    onToggleTask: toggleTaskCompleted,
    onDeleteTask: deleteTask,
    onEditTask: (id: string) => {
      setEditingTaskId(id);
      openModal('create_task');
    },
    onConvertTask: (id: string) => {
      setConvertingTaskId(id);
      openModal('convert_to_topic');
    },
    onToggleSubtask: toggleSubtask,
    onDeleteSubtask: deleteSubtask,
    addingSubtaskForTaskId,
    setAddingSubtaskForTaskId,
    subtaskTitle,
    setSubtaskTitle,
    subtaskDueDate,
    setSubtaskDueDate,
    subtaskRevision,
    setSubtaskRevision,
    onSaveSubtask: handleSaveSubtask,
    subjects,
    onAddTaskUnderSubject: (subId: string) => setCreatingTaskUnderSubjectId(subId),
    creatingTaskUnderSubjectId,
    subjectTaskTitle,
    setSubjectTaskTitle,
    subjectTaskDueDate,
    setSubjectTaskDueDate,
    subjectTaskRevision,
    setSubjectTaskRevision,
    onSaveTaskUnderSubject: handleSaveTaskUnderSubject,
    onCancelTaskUnderSubject: () => setCreatingTaskUnderSubjectId(null),
    onDragStart: (id: string) => setDraggedTaskId(id),
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: handleDrop,
    isDragging: draggedTaskId === task.id,
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="max-w-2xl mx-auto px-3 sm:px-6 pt-3 pb-32 space-y-4 animate-in fade-in duration-300 relative"
    >
      {/* Swipe-down / Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          style={{ height: isRefreshing ? 48 : pullDistance }}
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
        >
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-500 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: !isRefreshing ? `rotate(${pullDistance * 4}deg)` : undefined,
              }}
            />
            <span>{isRefreshing ? 'Updated' : 'Pull to refresh'}</span>
          </div>
        </div>
      )}

      {/* 1. Custom List Tabs ("Task Due", "Daily Task" and clean custom lists) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
            {/* 'Task Due' Tab */}
            <button
              onClick={() => {
                triggerHaptic('toggle');
                setActiveListId('all');
                setIsTrackerView(false);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                activeListId === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Task Due
            </button>

            {/* 'Daily Task' Default Tab */}
            <button
              onClick={() => {
                triggerHaptic('toggle');
                setActiveListId('daily');
                setIsTrackerView(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all active:scale-95 ${
                activeListId === 'daily'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span>Daily Task</span>
              {tasks.filter(t => (t.recurring === 'daily' || t.dueDate === today || (t.recurring && t.recurring !== 'none')) && !t.completed).length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeListId === 'daily'
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                      : 'bg-black/5 dark:bg-white/10 text-zinc-500'
                  }`}
                >
                  {tasks.filter(t => (t.recurring === 'daily' || t.dueDate === today || (t.recurring && t.recurring !== 'none')) && !t.completed).length}
                </span>
              )}
            </button>

            {/* Subject Folders Tabs */}
            {subjects.map(subject => {
              const isActive = activeListId === subject.id;
              const pendingCount = tasks.filter(t => t.subjectId === subject.id && !t.completed).length;

              return (
                <SubjectFolderTabItem
                  key={subject.id}
                  subject={subject}
                  isActive={isActive}
                  pendingCount={pendingCount}
                  onSelect={() => {
                    triggerHaptic('toggle');
                    setActiveListId(subject.id);
                    setIsTrackerView(false);
                  }}
                  onOpenActions={() => {
                    openQuickActions({
                      title: `${subject.name} Folder`,
                      subtitle: `Subject Folder • ${pendingCount} active tasks`,
                      actions: [
                        {
                          id: 'add-task-to-sub',
                          label: `Add Task in ${subject.name}`,
                          icon: 'plus' as const,
                          onSelect: () => openCreateTaskModal({ subjectId: subject.id, dueDate: today }),
                        },
                        {
                          id: 'rename-sub',
                          label: 'Rename Subject',
                          icon: 'edit' as const,
                          onSelect: () => {
                            const newName = prompt('Enter new subject name:', subject.name);
                            if (newName && newName.trim()) {
                              editSubject(subject.id, newName.trim(), subject.color);
                            }
                          },
                        },
                        {
                          id: 'copy-sub-tasks',
                          label: 'Copy All Tasks',
                          icon: 'check' as const,
                          onSelect: () => {
                            const subTasks = tasks.filter(t => t.subjectId === subject.id);
                            const text = subTasks.map(t => `${t.completed ? '✓' : '○'} ${t.title}`).join('\n');
                            navigator.clipboard?.writeText(text);
                          },
                        },
                        ...(subjects.length > 1
                          ? [
                              {
                                id: 'delete-sub',
                                label: 'Delete Subject Folder',
                                icon: 'delete' as const,
                                danger: true,
                                onSelect: () => {
                                  if (confirm(`Delete subject folder "${subject.name}"?`)) {
                                    deleteSubject(subject.id);
                                    if (activeListId === subject.id) setActiveListId('all');
                                  }
                                },
                              },
                            ]
                          : []),
                      ],
                    });
                  }}
                />
              );
            })}

            {/* Custom Lists Tabs */}
            {customLists.map((list, index) => {
              const isActive = activeListId === list.id;
              const pendingCount = tasks.filter(t => t.listId === list.id && !t.completed).length;

              return (
                <CustomListTabItem
                  key={list.id}
                  list={list}
                  isActive={isActive}
                  pendingCount={pendingCount}
                  onSelect={() => {
                    triggerHaptic('toggle');
                    setActiveListId(list.id);
                    setIsTrackerView(false);
                  }}
                  onOpenActions={() => {
                    openQuickActions({
                      title: list.name,
                      subtitle: `Custom List • ${pendingCount} active tasks`,
                      actions: [
                        {
                          id: 'move-list-up',
                          label: 'Move Up',
                          icon: 'up',
                          disabled: index === 0,
                          onSelect: () => moveCustomListUp(list.id),
                        },
                        {
                          id: 'move-list-down',
                          label: 'Move Down',
                          icon: 'down',
                          disabled: index === customLists.length - 1,
                          onSelect: () => moveCustomListDown(list.id),
                        },
                        {
                          id: 'duplicate-list',
                          label: 'Duplicate List',
                          icon: 'plus',
                          onSelect: () => duplicateCustomList(list.id),
                        },
                        {
                          id: 'copy-list',
                          label: 'Copy All Tasks',
                          icon: 'check',
                          onSelect: () => copyListTasksToClipboard(list.id),
                        },
                        {
                          id: 'rename-list',
                          label: 'Rename List',
                          icon: 'edit',
                          onSelect: () => {
                            const newName = prompt('Enter new list name:', list.name);
                            if (newName && newName.trim()) {
                              renameCustomList(list.id, newName.trim());
                            }
                          },
                        },
                        {
                          id: 'del-list',
                          label: 'Delete List',
                          icon: 'delete',
                          danger: true,
                          onSelect: () => deleteCustomList(list.id),
                        },
                      ],
                    });
                  }}
                />
              );
            })}

            {/* Clean Add List Button / Inline Input */}
            {isCreatingList ? (
              <form onSubmit={handleCreateList} className="flex items-center space-x-1 shrink-0 animate-in fade-in">
                <input
                  type="text"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="List name..."
                  autoFocus
                  className="px-3 py-1 text-xs rounded-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                />
                <button
                  type="submit"
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingList(false);
                    setNewListName('');
                  }}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsCreatingList(true);
                }}
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center shrink-0 border border-dashed border-zinc-300 dark:border-zinc-700 active:scale-90"
                title="Create clean custom list"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Notes pill trigger */}
          <button
            id="todo-quick-notes-pill"
            onClick={() => {
              triggerHaptic('light');
              openModal('quick_note');
            }}
            className="shrink-0 ml-2 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold flex items-center space-x-1 transition active:scale-95 shadow-xs"
            title="Open Quick Notes scratchpad"
          >
            <PenLine className="w-3 h-3" />
            <span>Notes</span>
            {quickNotes.length > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ml-0.5">
                {quickNotes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Unified Header for all list views:
          Shows List Title, Active count, and the separated View button right beside it!
      */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          {activeSubject && (
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: activeSubject.color }}
            />
          )}
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
            {activeSubject && <Folder className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
            {currentListName}
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 font-mono font-bold">
            {currentListTasks.filter(t => !t.completed).length}
          </span>

          {/* View button separated & selected to the side */}
          <button
            onClick={() => {
              triggerHaptic('toggle');
              setIsTrackerView(prev => !prev);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 flex items-center space-x-1 ${
              isTrackerView
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10'
            }`}
          >
            <span>View</span>
          </button>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            if (activeSubject) {
              openCreateTaskModal({ subjectId: activeSubject.id, dueDate: today });
            } else if (isDailyView) {
              openCreateTaskModal({ dueDate: today });
            } else if (activeCustomList) {
              openCreateTaskModal({ dueDate: today });
            } else {
              openModal('create_task');
            }
          }}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-500/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to list</span>
        </button>
      </div>

      {/* 3. Content Display:
          - If isTrackerView: Render ProgressTrackerView for this list!
          - If not isTrackerView:
            - If 'Task Due' (isAllView): Show reorderable Apple Folders with + to add task only!
            - If 'Daily Task' or Custom List: Show clean tasks with completed group!
      */}
      {isTrackerView ? (
        <ProgressTrackerView
          listId={activeListId}
          listName={currentListName}
          tasks={currentListTasks}
          onToggleStep={toggleTaskRevisionStep}
          onDuplicateList={duplicateCustomList}
          onCopyList={copyListTasksToClipboard}
          onRenameList={
            activeCustomList
              ? id => {
                  const newName = prompt('Enter new list name:', activeCustomList.name);
                  if (newName && newName.trim()) renameCustomList(id, newName.trim());
                }
              : undefined
          }
          onDeleteList={
            activeCustomList
              ? id => {
                  if (confirm(`Delete list "${activeCustomList.name}"?`)) {
                    deleteCustomList(id);
                  }
                }
              : undefined
          }
          isCustomList={!isAllView && !isDailyView}
        />
      ) : isAllView ? (
        /* --- TASK DUE VIEW: Apple Folders (Reorderable via Long Press) --- */
        <div className="space-y-3">
          {/* Toggle between Schedule and Subject Folders */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {taskDueGroupBy === 'schedule' ? 'Deadline Folders' : 'Subject Folders'}
            </span>
            <div className="flex items-center p-0.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-semibold">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setTaskDueGroupBy('schedule');
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  taskDueGroupBy === 'schedule'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setTaskDueGroupBy('subject');
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  taskDueGroupBy === 'subject'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Subject
              </button>
            </div>
          </div>

          {taskDueGroupBy === 'subject' ? (
            <>
              {subjects.map(sub => {
                const subTasks = tasks.filter(t => t.subjectId === sub.id && !t.completed);
                return (
                  <AppleFolderSection
                    key={`folder-sub-${sub.id}`}
                    title={sub.name}
                    tasks={subTasks}
                    isCollapsed={!!collapsedFolders[`sub-${sub.id}`]}
                    onToggle={() => toggleFolder(`sub-${sub.id}`)}
                    color={sub.color}
                    getTaskItemProps={getTaskItemProps}
                    onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true, subjectId: sub.id, dueDate: today })}
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
                    openQuickActions={openQuickActions}
                  />
                );
              })}

              {/* Tasks without assigned subject */}
              {tasks.filter(t => !t.subjectId && !t.completed).length > 0 && (
                <AppleFolderSection
                  key="folder-sub-general"
                  title="General / Other"
                  tasks={tasks.filter(t => !t.subjectId && !t.completed)}
                  isCollapsed={!!collapsedFolders['sub-general']}
                  onToggle={() => toggleFolder('sub-general')}
                  color="#6B7280"
                  getTaskItemProps={getTaskItemProps}
                  onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true, dueDate: today })}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  openQuickActions={openQuickActions}
                />
              )}

              {/* Completed Tasks in Subject View */}
              {groupedSchedule.completed.length > 0 && (
                <AppleFolderSection
                  key="folder-sub-completed"
                  title="Completed"
                  tasks={groupedSchedule.completed}
                  isCollapsed={!!collapsedFolders.completed}
                  onToggle={() => toggleFolder('completed')}
                  color="#8E8E93"
                  getTaskItemProps={getTaskItemProps}
                  onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true, dueDate: today })}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  openQuickActions={openQuickActions}
                />
              )}
            </>
          ) : (
            folderOrder.map(folderKey => {
              if (folderKey === 'today') {
                return (
                  <AppleFolderSection
                    key="today"
                    title="Today"
                    tasks={groupedSchedule.today}
                    isCollapsed={!!collapsedFolders.today}
                    onToggle={() => toggleFolder('today')}
                    color="#007AFF"
                    getTaskItemProps={getTaskItemProps}
                    onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true, dueDate: today })}
                    onMoveUp={() => moveFolderUp('today')}
                    onMoveDown={() => moveFolderDown('today')}
                    openQuickActions={openQuickActions}
                  />
                );
              }
              if (folderKey === 'tomorrow') {
                return (
                  <AppleFolderSection
                    key="tomorrow"
                    title="Tomorrow"
                    tasks={groupedSchedule.tomorrow}
                    isCollapsed={!!collapsedFolders.tomorrow}
                    onToggle={() => toggleFolder('tomorrow')}
                    color="#34C759"
                    getTaskItemProps={getTaskItemProps}
                    onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true, dueDate: tomorrow })}
                    onMoveUp={() => moveFolderUp('tomorrow')}
                    onMoveDown={() => moveFolderDown('tomorrow')}
                    openQuickActions={openQuickActions}
                  />
                );
              }
              if (folderKey === 'thisWeek') {
                return (
                  <AppleFolderSection
                    key="thisWeek"
                    title="This Week"
                    tasks={groupedSchedule.thisWeek}
                    isCollapsed={!!collapsedFolders.thisWeek}
                    onToggle={() => toggleFolder('thisWeek')}
                    color="#AF52DE"
                    getTaskItemProps={getTaskItemProps}
                    onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true, dueDate: weekEnd })}
                    onMoveUp={() => moveFolderUp('thisWeek')}
                    onMoveDown={() => moveFolderDown('thisWeek')}
                    openQuickActions={openQuickActions}
                  />
                );
              }
              if (folderKey === 'later') {
                if (groupedSchedule.later.length === 0) return null;
                return (
                  <AppleFolderSection
                    key="later"
                    title="Later / Other"
                    tasks={groupedSchedule.later}
                    isCollapsed={!!collapsedFolders.later}
                    onToggle={() => toggleFolder('later')}
                    color="#FF9500"
                    getTaskItemProps={getTaskItemProps}
                    onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true })}
                    onMoveUp={() => moveFolderUp('later')}
                    onMoveDown={() => moveFolderDown('later')}
                    openQuickActions={openQuickActions}
                  />
                );
              }
              if (folderKey === 'completed') {
                if (groupedSchedule.completed.length === 0) return null;
                return (
                  <AppleFolderSection
                    key="completed"
                    title="Completed"
                    tasks={groupedSchedule.completed}
                    isCollapsed={!!collapsedFolders.completed}
                    onToggle={() => toggleFolder('completed')}
                    color="#8E8E93"
                    getTaskItemProps={getTaskItemProps}
                    onAddTaskOnly={() => openCreateTaskModal({ onlyTask: true, dueDate: today })}
                    onMoveUp={() => moveFolderUp('completed')}
                    onMoveDown={() => moveFolderDown('completed')}
                    openQuickActions={openQuickActions}
                  />
                );
              }
              return null;
            })
          )}
        </div>
      ) : (
        /* --- DAILY TASK OR CUSTOM LIST VIEW: Clean List --- */
        <div className="space-y-3">
          {/* Active Tasks */}
          {currentListTasks.filter(t => !t.completed).length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center space-y-3 border border-black/5 dark:border-white/10">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Clean slate in {currentListName}
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                  {activeSubject
                    ? `No tasks scheduled in ${activeSubject.name} yet.`
                    : isDailyView
                    ? 'All daily tasks for today are completed or not yet scheduled.'
                    : 'Organize your specific tasks or projects here without schedule folders.'}
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  if (activeSubject) {
                    openCreateTaskModal({ subjectId: activeSubject.id, dueDate: today });
                  } else if (isDailyView) {
                    openCreateTaskModal({ dueDate: today });
                  } else {
                    openModal('create_task');
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold shadow-xs hover:scale-105 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add first task</span>
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-3 space-y-2 border border-black/5 dark:border-white/10 shadow-xs">
              {currentListTasks
                .filter(t => !t.completed)
                .map(task => (
                  <TaskItemCard key={task.id} {...getTaskItemProps(task)} />
                ))}
            </div>
          )}

          {/* Completed Tasks (Collapsible) */}
          {currentListTasks.filter(t => t.completed).length > 0 && (
            <div className="glass-card rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-xs transition-all">
              <button
                onClick={() => toggleFolder(`custom-${activeListId}-completed`)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0" />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Completed
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-mono font-bold text-zinc-500">
                    {currentListTasks.filter(t => t.completed).length}
                  </span>
                </div>
                <div className="text-zinc-400">
                  {collapsedFolders[`custom-${activeListId}-completed`] ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {!collapsedFolders[`custom-${activeListId}-completed`] && (
                <div className="p-3 pt-0 space-y-2 border-t border-black/5 dark:border-white/5">
                  {currentListTasks
                    .filter(t => t.completed)
                    .map(task => (
                      <TaskItemCard key={task.id} {...getTaskItemProps(task)} />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* --- Subject Folder Tab Item with Color Pip and Touch/Mouse Long-Press --- */
const SubjectFolderTabItem: React.FC<{
  subject: Subject;
  isActive: boolean;
  pendingCount: number;
  onSelect: () => void;
  onOpenActions: () => void;
}> = ({ subject, isActive, pendingCount, onSelect, onOpenActions }) => {
  const timerRef = useRef<any>(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      triggerHaptic('medium');
      onOpenActions();
    }, 450);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="relative group shrink-0 flex items-center">
      <button
        onClick={onSelect}
        onContextMenu={e => {
          e.preventDefault();
          cancelPress();
          onOpenActions();
        }}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all active:scale-95 select-none ${
          isActive
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Long-press to manage subject folder"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: subject.color }}
        />
        <span>{subject.name}</span>
        {pendingCount > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isActive
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                : 'bg-black/5 dark:bg-white/10 text-zinc-500'
            }`}
          >
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
};

/* --- Custom List Tab Item with Touch & Mouse Long-Press Support (No visible delete button) --- */
const CustomListTabItem: React.FC<{
  list: { id: string; name: string };
  isActive: boolean;
  pendingCount: number;
  onSelect: () => void;
  onOpenActions: () => void;
}> = ({ list, isActive, pendingCount, onSelect, onOpenActions }) => {
  const timerRef = useRef<any>(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      triggerHaptic('medium');
      onOpenActions();
    }, 450);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="relative group shrink-0 flex items-center">
      <button
        onClick={onSelect}
        onContextMenu={e => {
          e.preventDefault();
          cancelPress();
          onOpenActions();
        }}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all active:scale-95 select-none ${
          isActive
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        title="Long-press to reorder or manage list"
      >
        <span>{list.name}</span>
        {pendingCount > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isActive
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                : 'bg-black/5 dark:bg-white/10 text-zinc-500'
            }`}
          >
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
};

/* --- Apple-Style Folder Section Component for Task Due with Long Press & Add Task Only --- */
interface AppleFolderSectionProps {
  title: string;
  tasks: Task[];
  isCollapsed: boolean;
  onToggle: () => void;
  color: string;
  getTaskItemProps: (task: Task) => any;
  onAddTaskOnly: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  openQuickActions: (config: any) => void;
}

const AppleFolderSection: React.FC<AppleFolderSectionProps> = ({
  title,
  tasks,
  isCollapsed,
  onToggle,
  color,
  getTaskItemProps,
  onAddTaskOnly,
  onMoveUp,
  onMoveDown,
  openQuickActions,
}) => {
  const timerRef = useRef<any>(null);

  const handleOpenFolderActions = () => {
    openQuickActions({
      title: `${title} Folder`,
      subtitle: `${tasks.length} tasks scheduled`,
      actions: [
        {
          id: 'move-folder-up',
          label: 'Move Folder Up',
          icon: 'up',
          onSelect: onMoveUp,
        },
        {
          id: 'move-folder-down',
          label: 'Move Folder Down',
          icon: 'down',
          onSelect: onMoveDown,
        },
        {
          id: 'add-task-folder',
          label: 'Add Task Only',
          icon: 'plus',
          onSelect: onAddTaskOnly,
        },
        {
          id: 'toggle-folder',
          label: isCollapsed ? 'Expand Folder' : 'Collapse Folder',
          icon: 'toggle',
          onSelect: onToggle,
        },
      ],
    });
  };

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      triggerHaptic('medium');
      handleOpenFolderActions();
    }, 450);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden transition-all shadow-xs border border-black/5 dark:border-white/10">
      {/* Folder Header */}
      <div
        onClick={onToggle}
        onContextMenu={e => {
          e.preventDefault();
          cancelPress();
          handleOpenFolderActions();
        }}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer select-none"
        title="Click to toggle, long-press to reorder folder"
      >
        <div className="flex items-center space-x-2.5">
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {title}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* + icon to folder: add task only */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              triggerHaptic('light');
              onAddTaskOnly();
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition"
            title={`Add task only to ${title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="text-zinc-400">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Folder Contents */}
      {!isCollapsed && (
        <div className="p-3 pt-0 space-y-2 border-t border-black/5 dark:border-white/5">
          {tasks.length === 0 ? (
            <div className="py-3 text-center text-xs text-zinc-400 italic">
              No tasks scheduled for {title}.
            </div>
          ) : (
            tasks.map(task => (
              <TaskItemCard key={task.id} {...getTaskItemProps(task)} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
