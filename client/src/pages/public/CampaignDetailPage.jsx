import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SkeletonDetailPage } from '../../components/ui/Skeleton';
import { useCampaign } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { campaignAPI } from '../../services/api';
import { formatDateRange, formatDate, getAssetUrl, getGoogleMapsUrl, missionStatusConfig, taskStatusConfig } from '../../utils/helpers';
import toast from 'react-hot-toast';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const InfoRow = ({ icon, label, value }) => (
  value ? (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  ) : null
);

const applicationLabelMap = {
  pending: 'Application pending',
  accepted: 'Application accepted',
  rejected: 'Application reviewed',
  cancelled: 'Application cancelled',
};

const MissionCard = ({ mission, onParticipate, isAuthenticated, viewerRole, applying }) => {
  const config = missionStatusConfig[mission.status] || missionStatusConfig.open;
  const spotsLeft = mission.required_volunteers - (mission.assigned_count || 0);
  const hasApplied = !!mission.application_status;
  const applicationLabel = applicationLabelMap[mission.application_status];
  const isAccepted = mission.application_status === 'accepted';
  const hasAssignedTask = !!mission.assigned_task_title;
  const missionTasks = mission.tasks || [];
  const assignedTaskConfig = mission.assigned_task_status
    ? (taskStatusConfig[mission.assigned_task_status] || taskStatusConfig.todo)
    : null;

  return (
    <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-semibold text-slate-900 text-base leading-snug">{mission.title}</h4>
        <span className={`badge ${config.className} flex-shrink-0`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {config.label}
        </span>
      </div>

      {mission.description && (
        <p className="text-sm text-slate-500 leading-relaxed mb-4">{mission.description}</p>
      )}

      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.85),rgba(240,249,255,0.88))]">
        <div className="flex items-start justify-between gap-3 border-b border-emerald-100 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Mission tasks</p>
            <p className="mt-1 text-sm text-slate-600">
              {missionTasks.length
                ? 'Review the detailed tasks before you apply.'
                : 'Detailed task slots are not published yet for this mission.'}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {missionTasks.length} task{missionTasks.length === 1 ? '' : 's'}
          </span>
        </div>

        {missionTasks.length ? (
          <div>
            <div className="hidden bg-white/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:grid sm:grid-cols-[minmax(0,1.15fr)_auto_auto] sm:gap-3">
              <span>Task</span>
              <span>Status</span>
              <span>Capacity</span>
            </div>
            <div className="divide-y divide-emerald-100">
            {missionTasks.map((task) => {
              const taskConfig = taskStatusConfig[task.status] || taskStatusConfig.todo;
              const slotsLeft = Math.max(0, Number(task.required_volunteers || 0) - Number(task.assigned_count || 0));

              return (
                <div key={task.id} className="px-4 py-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1.15fr)_auto_auto] sm:items-start">
                    <div>
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{task.description}</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:hidden">Status</p>
                      <span className={`badge ${taskConfig.className}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {taskConfig.label}
                      </span>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:hidden">Capacity</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{task.required_volunteers} needed</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{task.assigned_count || 0} assigned</span>
                        <span className={`rounded-full px-3 py-1.5 ${slotsLeft > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {slotsLeft} slot{slotsLeft === 1 ? '' : 's'} left
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 text-sm text-slate-500">
            The admin can still publish the detailed task list later.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {mission.mission_date && (
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-400 font-medium mb-0.5">Date</p>
            <p className="text-sm font-semibold text-slate-700">{formatDate(mission.mission_date)}</p>
          </div>
        )}
        {mission.location && (
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-400 font-medium mb-0.5">Location</p>
            <p className="text-sm font-semibold text-slate-700 truncate">{mission.location}</p>
          </div>
        )}
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400 font-medium mb-0.5">Volunteers needed</p>
          <p className="text-sm font-semibold text-slate-700">{mission.required_volunteers}</p>
        </div>
        <div className={`rounded-lg px-3 py-2 ${spotsLeft > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-xs font-medium mb-0.5 ${spotsLeft > 0 ? 'text-emerald-600' : 'text-red-500'}`}>Spots available</p>
          <p className={`text-sm font-semibold ${spotsLeft > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {Math.max(0, spotsLeft)} left
          </p>
        </div>
      </div>

      {/* Volunteer bar */}
      {mission.required_volunteers > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{mission.assigned_count || 0} assigned</span>
            <span>{mission.required_volunteers} needed</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((mission.assigned_count || 0) / mission.required_volunteers) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {(hasAssignedTask || isAccepted) && (
        <div className={`mb-4 rounded-xl border px-4 py-3 ${
          hasAssignedTask ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                hasAssignedTask ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {hasAssignedTask ? 'Your assigned task' : 'Application approved'}
              </p>
              <p className={`mt-1 text-sm font-semibold ${
                hasAssignedTask ? 'text-emerald-900' : 'text-amber-900'
              }`}>
                {hasAssignedTask ? mission.assigned_task_title : 'Waiting for detailed task placement'}
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${
                hasAssignedTask ? 'text-emerald-800/80' : 'text-amber-800/80'
              }`}>
                {hasAssignedTask
                  ? 'An admin has assigned you to this task. Check the mission date and location before you go.'
                  : 'Your request was accepted. You will receive a notification as soon as an admin places you on a task.'}
              </p>
            </div>
            {assignedTaskConfig && (
              <span className={`badge ${assignedTaskConfig.className} flex-shrink-0`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {assignedTaskConfig.label}
              </span>
            )}
          </div>
        </div>
      )}

      {hasAssignedTask && (
        <Button variant="secondary" size="sm" className="w-full" disabled>
          Task assigned
        </Button>
      )}
      {!hasAssignedTask && isAccepted && (
        <Button variant="secondary" size="sm" className="w-full" disabled>
          Accepted, waiting for task
        </Button>
      )}
      {!hasAssignedTask && !isAccepted && mission.status === 'open' && spotsLeft > 0 && hasApplied && (
        <Button variant="secondary" size="sm" className="w-full" disabled>
          {applicationLabel || 'Application sent'}
        </Button>
      )}
      {!hasAssignedTask && !isAccepted && mission.status === 'open' && spotsLeft > 0 && !hasApplied && isAuthenticated && viewerRole !== 'volunteer' && (
        <p className="text-center text-xs text-amber-600 font-medium py-1">
          Only volunteer accounts can apply
        </p>
      )}
      {!hasAssignedTask && !isAccepted && mission.status === 'open' && spotsLeft > 0 && !hasApplied && (!isAuthenticated || viewerRole === 'volunteer') && (
        <Button variant="primary" size="sm" className="w-full" onClick={() => onParticipate(mission)} loading={applying}>
          {applying ? 'Submitting application...' : 'Apply to participate'}
        </Button>
      )}
      {!hasAssignedTask && !isAccepted && (mission.status !== 'open' || spotsLeft <= 0) && (
        <p className="text-center text-xs text-slate-400 font-medium py-1">
          {spotsLeft <= 0 ? 'All spots filled' : 'Applications closed'}
        </p>
      )}
    </div>
  );
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { campaign, missions, loading, error, refetch } = useCampaign(id);
  const [applyingMissionId, setApplyingMissionId] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [motivation, setMotivation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapsUrl = campaign ? getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude) : null;
  const hasCoordinates = campaign && Number.isFinite(Number(campaign.latitude)) && Number.isFinite(Number(campaign.longitude));
  const mapPosition = hasCoordinates ? [Number(campaign.latitude), Number(campaign.longitude)] : null;

  const handleOpenMotivationModal = (mission) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to apply for a mission.');
      navigate('/login', { state: { from: { pathname: `/campaigns/${id}` } } });
      return;
    }

    if (user?.role !== 'volunteer') {
      toast.error('Only volunteer accounts can apply to missions.');
      return;
    }

    setSelectedMission(mission);
    setMotivation('');
  };

  const handleCloseModal = () => {
    setSelectedMission(null);
    setMotivation('');
    setIsSubmitting(false);
  };

  const handleSubmitApplication = async () => {
    if (!motivation.trim()) {
      toast.error('Please write a motivation before applying.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await campaignAPI.applyToMission(id, selectedMission.id, { motivation });
      toast.success(response.data.message || `Application submitted for "${selectedMission.title}".`);
      handleCloseModal();
      await refetch();
    } catch (applyError) {
      toast.error(applyError.response?.data?.message || 'Could not submit your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParticipate = (mission) => {
    handleOpenMotivationModal(mission);
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Campaign not found</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/')} icon={<BackIcon />}>Back to campaigns</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-8 group"
        >
          <BackIcon />
          <span className="group-hover:-translate-x-0.5 transition-transform">Back to campaigns</span>
        </button>

        {loading ? (
          <SkeletonDetailPage />
        ) : campaign ? (
          <div className="animate-fade-in">
            {/* Campaign header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden mb-8">
              {campaign.image_url && (
                <div className="relative h-72 sm:h-80 bg-slate-100">
                  <img
                    src={getAssetUrl(campaign.image_url)}
                    alt={campaign.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />
                </div>
              )}

              <div className="p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge status={campaign.status} />
                {campaign.organizer_name && (
                  <span className="text-sm text-slate-500">
                    by <strong className="text-slate-700">{campaign.organizer_name}</strong>
                  </span>
                )}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                {campaign.title}
              </h1>

              {campaign.description && (
                <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-3xl">
                  {campaign.description}
                </p>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6 border-t border-slate-100">
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  label="Location"
                  value={campaign.location}
                />
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  label="Campaign period"
                  value={formatDateRange(campaign.start_date, campaign.end_date)}
                />
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  label="Organizer"
                  value={campaign.organizer_name}
                />
              </div>
              </div>
            </div>

            {hasCoordinates && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden mb-8">
                <div className="p-8 pb-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-slate-900">Campaign location</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        See exactly where this campaign is taking place.
                      </p>
                    </div>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </div>
                <div className="h-80 w-full border-t border-slate-100">
                  <MapContainer center={mapPosition} zoom={13} scrollWheelZoom className="h-full w-full z-0">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={mapPosition} />
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Missions section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Missions</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {missions.length > 0
                      ? `${missions.length} mission${missions.length !== 1 ? 's' : ''} available for this campaign`
                      : 'No missions added yet'}
                  </p>
                </div>
                {!isAuthenticated && missions.some((m) => m.status === 'open') && (
                  <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sign in to participate
                  </div>
                )}
                {isAuthenticated && user?.role !== 'volunteer' && missions.some((m) => m.status === 'open') && (
                  <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.88 6.197M15 11a3 3 0 11-6 0 3 3 0 016 0zm7 10l-4.35-4.35" />
                    </svg>
                    Volunteer accounts can apply
                  </div>
                )}
              </div>

              {missions.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No missions have been added to this campaign yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {missions.map((mission) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      onParticipate={handleParticipate}
                      isAuthenticated={isAuthenticated}
                      viewerRole={user?.role}
                      applying={applyingMissionId === mission.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Motivation Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Apply to Mission</h2>
                  <p className="text-sm text-slate-500 mt-1">{selectedMission.title}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="motivation" className="block text-sm font-semibold text-slate-900 mb-2">
                  Your Motivation <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Tell the organizer why you want to participate in this mission.
                </p>
                <textarea
                  id="motivation"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Share your motivation and why you're interested in this mission..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows="5"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-400 mt-2">
                  {motivation.length} characters
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSubmitting || !motivation.trim()}
              >
                {isSubmitting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CampaignDetailPage;
