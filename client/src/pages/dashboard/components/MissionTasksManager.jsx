import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { campaignAPI } from '../../../services/api';
import { taskStatusConfig } from '../../../utils/helpers';
import {
  EmptyPanel,
  createEmptyTaskForm,
  formatOptionLabel,
  taskStatuses,
} from './DashboardPrimitives';

const taskToneMap = {
  todo: {
    panel: 'border-sky-200 bg-sky-50/80',
    chip: 'bg-sky-100 text-sky-700',
    metric: 'bg-sky-100 text-sky-700',
  },
  in_progress: {
    panel: 'border-amber-200 bg-amber-50/80',
    chip: 'bg-amber-100 text-amber-700',
    metric: 'bg-amber-100 text-amber-700',
  },
  completed: {
    panel: 'border-emerald-200 bg-emerald-50/80',
    chip: 'bg-emerald-100 text-emerald-700',
    metric: 'bg-emerald-100 text-emerald-700',
  },
  cancelled: {
    panel: 'border-rose-200 bg-rose-50/80',
    chip: 'bg-rose-100 text-rose-700',
    metric: 'bg-rose-100 text-rose-700',
  },
};

const MissionTasksManager = ({ campaignId, mission, onTasksChanged }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(createEmptyTaskForm());

  const loadTasks = useCallback(async () => {
    if (!campaignId || !mission?.id) return;

    setLoading(true);
    try {
      const response = await campaignAPI.getMissionTasks(campaignId, mission.id);
      setTasks(response.data.data.tasks || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load tasks for this mission.');
    } finally {
      setLoading(false);
    }
  }, [campaignId, mission?.id]);

  useEffect(() => {
    setEditingTaskId(null);
    setTaskForm(createEmptyTaskForm());
    loadTasks();
  }, [loadTasks]);

  const resetTaskEditor = () => {
    setEditingTaskId(null);
    setTaskForm(createEmptyTaskForm());
  };

  const handleTaskChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      required_volunteers: String(task.required_volunteers ?? 1),
      status: task.status || 'todo',
    });
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    setSubmittingTask(true);

    try {
      const payload = {
        ...taskForm,
        required_volunteers: taskForm.required_volunteers || '1',
      };

      const response = editingTaskId
        ? await campaignAPI.updateMissionTask(campaignId, mission.id, editingTaskId, payload)
        : await campaignAPI.createMissionTask(campaignId, mission.id, payload);

      toast.success(response.data.message || `Task ${editingTaskId ? 'updated' : 'created'} successfully.`);
      resetTaskEditor();
      await loadTasks();
      if (onTasksChanged) {
        await onTasksChanged();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not ${editingTaskId ? 'update' : 'create'} task.`);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"? Volunteers assigned to it will return to the mission pool.`)) {
      return;
    }

    setBusyTaskId(task.id);
    try {
      const response = await campaignAPI.removeMissionTask(campaignId, mission.id, task.id);
      toast.success(response.data.message || 'Task deleted.');
      if (editingTaskId === task.id) {
        resetTaskEditor();
      }
      await loadTasks();
      if (onTasksChanged) {
        await onTasksChanged();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete this task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <div className="mt-4 rounded-3xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(240,249,255,0.96))] p-5 shadow-[0_20px_60px_-35px_rgba(5,150,105,0.35)]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h5 className="font-display text-lg text-slate-900">{editingTaskId ? 'Edit task' : 'Mission tasks'}</h5>
          <p className="text-sm text-slate-500">
            Break this mission into concrete tasks so admins can drag volunteers into the right slots.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} configured for this mission.
        </div>
      </div>

      <form onSubmit={handleSaveTask} className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/95 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Task title"
            name="title"
            value={taskForm.title}
            onChange={handleTaskChange}
            placeholder="Prepare donation packs"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`task-description-${mission.id}`} className="text-sm font-semibold text-slate-700">Description</label>
          <textarea
            id={`task-description-${mission.id}`}
            name="description"
            value={taskForm.description}
            onChange={handleTaskChange}
            rows={3}
            placeholder="Describe the work, tools needed, or the handoff between volunteers."
            className="input-field mt-1.5 resize-none"
          />
        </div>
        <Input
          label="Volunteers needed"
          name="required_volunteers"
          type="number"
          min="1"
          value={taskForm.required_volunteers}
          onChange={handleTaskChange}
          placeholder="3"
          required
        />
        <div>
          <label htmlFor={`task-status-${mission.id}`} className="text-sm font-semibold text-slate-700">Status</label>
          <select
            id={`task-status-${mission.id}`}
            name="status"
            value={taskForm.status}
            onChange={handleTaskChange}
            className="input-field mt-1.5"
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>{formatOptionLabel(status)}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <div className="flex gap-3">
            {editingTaskId && (
              <Button type="button" variant="secondary" onClick={resetTaskEditor}>
                Cancel task edit
              </Button>
            )}
            <Button type="submit" loading={submittingTask}>
              {submittingTask ? 'Saving task...' : editingTaskId ? 'Update task' : 'Create task'}
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-5">
        <div className="mb-4">
          <h5 className="font-display text-lg text-slate-900">Current tasks</h5>
          <p className="text-sm text-slate-500">
            {loading
              ? 'Refreshing task data...'
              : 'These task slots will appear in the admin assignment board.'}
          </p>
        </div>

        {loading ? (
          <Card className="px-4 py-5 text-sm text-slate-500">Loading tasks...</Card>
        ) : tasks.length ? (
          <div className="space-y-3">
            {tasks.map((task) => {
              const taskBadge = taskStatusConfig[task.status] || taskStatusConfig.todo;
              const taskTone = taskToneMap[task.status] || taskToneMap.todo;
              const spotsLeft = Math.max(0, Number(task.required_volunteers || 0) - Number(task.assigned_count || 0));

              return (
                <div key={task.id} className={`rounded-2xl border p-4 shadow-sm ${taskTone.panel}`}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <span className={`badge ${taskBadge.className}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                            {taskBadge.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-500">{task.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => handleEditTask(task)}>
                          Edit task
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          loading={busyTaskId === task.id}
                          onClick={() => handleDeleteTask(task)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-3 py-1.5 ${taskTone.chip}`}>{task.required_volunteers} needed</span>
                      <span className="rounded-full bg-white/80 px-3 py-1.5 text-slate-600">{task.assigned_count || 0} assigned</span>
                      <span className={`rounded-full px-3 py-1.5 ${spotsLeft > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {spotsLeft} slot{spotsLeft === 1 ? '' : 's'} left
                      </span>
                      <span className={`rounded-full px-3 py-1.5 ${taskTone.metric}`}>
                        {task.status === 'todo' ? 'Ready to assign' : formatOptionLabel(task.status)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyPanel
            title="No tasks for this mission yet"
            description="Create at least one task here, then admins can distribute accepted volunteers across the mission board."
          />
        )}
      </div>
    </div>
  );
};

export default MissionTasksManager;
