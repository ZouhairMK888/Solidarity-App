import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import { adminAPI, campaignAPI } from '../../../services/api';
import { taskStatusConfig } from '../../../utils/helpers';
import { EmptyPanel } from './DashboardPrimitives';

const summaryToneMap = {
  accepted: 'border-sky-200 bg-sky-50/80',
  placed: 'border-emerald-200 bg-emerald-50/80',
  waiting: 'border-amber-200 bg-amber-50/80',
  tasks: 'border-slate-200 bg-white',
};

const laneToneMap = {
  todo: {
    panel: 'border-sky-200 bg-sky-50/65',
    empty: 'border-sky-200 bg-white/80 text-sky-700',
  },
  in_progress: {
    panel: 'border-amber-200 bg-amber-50/65',
    empty: 'border-amber-200 bg-white/80 text-amber-700',
  },
  completed: {
    panel: 'border-emerald-200 bg-emerald-50/65',
    empty: 'border-emerald-200 bg-white/80 text-emerald-700',
  },
  cancelled: {
    panel: 'border-rose-200 bg-rose-50/65',
    empty: 'border-rose-200 bg-white/80 text-rose-700',
  },
};

const SummaryCard = ({ label, value, hint, tone = 'tasks' }) => (
  <div className={`rounded-3xl border px-5 py-4 shadow-sm ${summaryToneMap[tone] || summaryToneMap.tasks}`}>
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-3 font-display text-3xl text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{hint}</p>
  </div>
);

const VolunteerCard = ({
  assignment,
  tasks,
  isBusy,
  onMove,
  onDragStart,
  onDragEnd,
  compact = false,
}) => (
  <div
    draggable={!isBusy}
    onDragStart={(event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(assignment.id));
      onDragStart(assignment.id);
    }}
    onDragEnd={onDragEnd}
    className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition ${
      compact ? 'p-3' : 'p-4'
    } ${
      isBusy ? 'opacity-70' : 'cursor-grab active:cursor-grabbing hover:border-emerald-200 hover:shadow-md'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{assignment.volunteer_name}</p>
        <p className={`mt-1 truncate text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>{assignment.volunteer_email}</p>
        {assignment.volunteer_phone && (
          <p className="mt-1 truncate text-xs text-slate-400">{assignment.volunteer_phone}</p>
        )}
      </div>
      <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Drag
      </div>
    </div>

    <div className={compact ? 'mt-3' : 'mt-4'}>
      <label htmlFor={`assignment-${assignment.id}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Move to
      </label>
      <select
        id={`assignment-${assignment.id}`}
        value={assignment.task_id || ''}
        onChange={(event) => onMove(assignment.id, event.target.value ? Number(event.target.value) : null)}
        disabled={isBusy}
        className={`input-field mt-1.5 ${compact ? 'py-2 text-xs' : 'text-sm'}`}
      >
        <option value="">Unassigned pool</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>{task.title}</option>
        ))}
      </select>
    </div>
  </div>
);

const MissionTaskBoard = ({ campaigns = [] }) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [missions, setMissions] = useState([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [boardData, setBoardData] = useState(null);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [savingAssignmentId, setSavingAssignmentId] = useState(null);
  const [draggedAssignmentId, setDraggedAssignmentId] = useState(null);
  const [dragOverLane, setDragOverLane] = useState(null);

  const selectedMission = useMemo(
    () => missions.find((mission) => String(mission.id) === String(selectedMissionId)) || null,
    [missions, selectedMissionId]
  );

  const loadBoard = useCallback(async (missionId) => {
    if (!missionId) {
      setBoardData(null);
      return;
    }

    setLoadingBoard(true);
    try {
      const response = await adminAPI.getMissionTaskBoard(missionId);
      setBoardData(response.data.data);
    } catch (error) {
      setBoardData(null);
      toast.error(error.response?.data?.message || 'Could not load the task board for this mission.');
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  const loadMissions = useCallback(async (campaignId) => {
    if (!campaignId) {
      setMissions([]);
      setSelectedMissionId('');
      setBoardData(null);
      return;
    }

    setLoadingMissions(true);
    try {
      const response = await campaignAPI.getMissions(campaignId);
      const nextMissions = response.data.data.missions || [];
      setMissions(nextMissions);
      setSelectedMissionId((currentMissionId) => {
        if (nextMissions.some((mission) => String(mission.id) === String(currentMissionId))) {
          return currentMissionId;
        }
        return nextMissions[0] ? String(nextMissions[0].id) : '';
      });
    } catch (error) {
      setMissions([]);
      setSelectedMissionId('');
      setBoardData(null);
      toast.error(error.response?.data?.message || 'Could not load missions for this campaign.');
    } finally {
      setLoadingMissions(false);
    }
  }, []);

  useEffect(() => {
    if (!campaigns.length) {
      setSelectedCampaignId('');
      return;
    }

    setSelectedCampaignId((currentCampaignId) => {
      if (campaigns.some((campaign) => String(campaign.id) === String(currentCampaignId))) {
        return currentCampaignId;
      }
      return String(campaigns[0].id);
    });
  }, [campaigns]);

  useEffect(() => {
    loadMissions(selectedCampaignId);
  }, [loadMissions, selectedCampaignId]);

  useEffect(() => {
    loadBoard(selectedMissionId);
  }, [loadBoard, selectedMissionId]);

  const handleMoveAssignment = async (assignmentId, taskId) => {
    if (!selectedMissionId) return;

    setSavingAssignmentId(assignmentId);
    try {
      await adminAPI.updateMissionTaskAssignment(selectedMissionId, assignmentId, { taskId });
      await loadBoard(selectedMissionId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not move this volunteer right now.');
    } finally {
      setSavingAssignmentId(null);
      setDraggedAssignmentId(null);
      setDragOverLane(null);
    }
  };

  const handleDrop = async (taskId) => {
    if (!draggedAssignmentId) return;
    await handleMoveAssignment(draggedAssignmentId, taskId);
  };

  const boardTasks = boardData?.tasks || [];
  const taskRows = boardTasks.map((task) => {
    const taskBadge = taskStatusConfig[task.status] || taskStatusConfig.todo;
    const laneTone = laneToneMap[task.status] || laneToneMap.todo;
    const spotsLeft = Math.max(0, Number(task.required_volunteers || 0) - Number(task.assigned_count || 0));

    return {
      ...task,
      taskBadge,
      laneTone,
      spotsLeft,
      volunteers: task.volunteers || [],
    };
  });

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-slate-900">Task assignment board</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a mission, then drag accepted volunteers into task lanes. On mobile, use the selector inside each card.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-[15rem]">
            <label htmlFor="board-campaign" className="text-sm font-semibold text-slate-700">Campaign</label>
            <select
              id="board-campaign"
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
              className="input-field mt-1.5"
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[15rem]">
            <label htmlFor="board-mission" className="text-sm font-semibold text-slate-700">Mission</label>
            <select
              id="board-mission"
              value={selectedMissionId}
              onChange={(event) => setSelectedMissionId(event.target.value)}
              className="input-field mt-1.5"
              disabled={loadingMissions || !missions.length}
            >
              {missions.length ? missions.map((mission) => (
                <option key={mission.id} value={mission.id}>{mission.title}</option>
              )) : (
                <option value="">No missions available</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {!campaigns.length ? (
        <EmptyPanel
          title="No campaigns available for assignment"
          description="Create a campaign and at least one mission first, then the board will be ready for volunteer placement."
        />
      ) : loadingMissions || loadingBoard ? (
        <Card className="px-6 py-5 text-sm text-slate-500">
          {loadingMissions ? 'Loading missions for this campaign...' : 'Loading assignment board...'}
        </Card>
      ) : !selectedMission ? (
        <EmptyPanel
          title="No mission selected"
          description="Choose a campaign with missions to open the task assignment board."
        />
      ) : !boardData ? (
        <EmptyPanel
          title="Task board unavailable"
          description="The selected mission could not be loaded right now."
        />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-4">
            <SummaryCard
              label="Accepted"
              value={boardData.summary?.accepted_volunteers || 0}
              hint="Volunteers already approved for this mission."
              tone="accepted"
            />
            <SummaryCard
              label="Placed"
              value={boardData.summary?.assigned_to_tasks || 0}
              hint="Volunteers currently sitting inside a task lane."
              tone="placed"
            />
            <SummaryCard
              label="Waiting"
              value={boardData.summary?.unassigned_volunteers || 0}
              hint="Accepted volunteers still waiting in the mission pool."
              tone="waiting"
            />
            <SummaryCard
              label="Tasks"
              value={boardData.summary?.task_count || 0}
              hint="Configured task lanes for this mission."
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900 px-5 py-4 text-sm text-slate-200">
            <span className="font-semibold text-white">{boardData.mission?.title}</span>
            {boardData.campaign?.title && (
              <span className="text-slate-300"> in {boardData.campaign.title}</span>
            )}
            <span className="text-slate-300">. Accepted requests land in the unassigned pool first.</span>
          </div>

          {!taskRows.length ? (
            <EmptyPanel
              title="No tasks configured for this mission"
              description="Add mission tasks from the Campaigns page first. Once tasks exist, you can drag volunteers into each lane here."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.5fr]">
              <Card
                className={`border ${
                  dragOverLane === 'unassigned'
                    ? 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-100'
                    : 'border-slate-200 bg-white'
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverLane('unassigned');
                }}
                onDragLeave={() => {
                  if (dragOverLane === 'unassigned') {
                    setDragOverLane(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(null);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-slate-900">Unassigned volunteers</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Approved volunteers waiting for detailed placement.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {boardData.summary?.unassigned_volunteers || 0} waiting
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {boardData?.unassigned_volunteers?.length ? boardData.unassigned_volunteers.map((assignment) => (
                    <VolunteerCard
                      key={assignment.id}
                      assignment={assignment}
                      tasks={boardTasks}
                      isBusy={savingAssignmentId === assignment.id}
                      onMove={handleMoveAssignment}
                      onDragStart={setDraggedAssignmentId}
                      onDragEnd={() => {
                        setDraggedAssignmentId(null);
                        setDragOverLane(null);
                      }}
                    />
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                      Everyone is already placed on a task.
                    </div>
                  )}
                </div>
              </Card>

              <Card padding={false} className="overflow-hidden border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
                  <h3 className="font-display text-xl">Task table</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Drag volunteers into a row or use the selector inside each volunteer card.
                  </p>
                </div>

                <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:grid lg:grid-cols-[minmax(0,1.15fr)_9rem_9rem_minmax(0,1.7fr)] lg:gap-4">
                  <span>Task</span>
                  <span>Status</span>
                  <span>Capacity</span>
                  <span>Assigned volunteers</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {taskRows.map((task) => (
                    <div
                      key={task.id}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverLane(String(task.id));
                      }}
                      onDragLeave={() => {
                        if (dragOverLane === String(task.id)) {
                          setDragOverLane(null);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDrop(task.id);
                      }}
                      className={`px-5 py-4 transition ${
                        dragOverLane === String(task.id)
                          ? 'bg-emerald-50/80'
                          : task.laneTone.panel
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_9rem_9rem_minmax(0,1.7fr)] lg:items-start">
                        <div>
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          {task.description && (
                            <p className="mt-1 text-sm leading-relaxed text-slate-500">{task.description}</p>
                          )}
                        </div>

                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">Status</p>
                          <span className={`badge ${task.taskBadge.className}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                            {task.taskBadge.label}
                          </span>
                        </div>

                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">Capacity</p>
                          <div className="rounded-2xl bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm">
                            <p className="font-semibold text-slate-900">
                              {task.assigned_count || 0} / {task.required_volunteers}
                            </p>
                            <p className="mt-1 text-xs">
                              {task.spotsLeft} slot{task.spotsLeft === 1 ? '' : 's'} left
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:hidden">Assigned volunteers</p>
                          {task.volunteers.length ? (
                            <div className="grid gap-2 xl:grid-cols-2">
                              {task.volunteers.map((assignment) => (
                                <VolunteerCard
                                  key={assignment.id}
                                  assignment={assignment}
                                  tasks={boardTasks}
                                  isBusy={savingAssignmentId === assignment.id}
                                  onMove={handleMoveAssignment}
                                  onDragStart={setDraggedAssignmentId}
                                  onDragEnd={() => {
                                    setDraggedAssignmentId(null);
                                    setDragOverLane(null);
                                  }}
                                  compact
                                />
                              ))}
                            </div>
                          ) : (
                            <div className={`rounded-2xl border border-dashed px-4 py-5 text-center text-sm ${task.laneTone.empty}`}>
                              Drop volunteers here.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default MissionTaskBoard;
