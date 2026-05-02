import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { SkeletonDetailPage } from '../../components/ui/Skeleton';
import { useCampaign } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { campaignAPI } from '../../services/api';
import {
  formatDateRange,
  formatDate,
  formatAmount,
  getAssetUrl,
  getGoogleMapsUrl,
  missionStatusConfig,
  taskStatusConfig,
} from '../../utils/helpers';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createDonationForm = (user) => ({
  donor_name: user?.name || '',
  donor_email: user?.email || '',
  type: 'financial',
  amount: '',
  description: '',
});

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const InfoRow = ({ icon, label, value }) => (
  value ? (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</span>
      <div>
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
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
    <div className="card p-5 transition-all duration-200 hover:shadow-card-hover">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold leading-snug text-slate-900">{mission.title}</h4>
        <span className={`badge ${config.className} flex-shrink-0`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {config.label}
        </span>
      </div>

      {mission.description && (
        <p className="mb-4 text-sm leading-relaxed text-slate-500">{mission.description}</p>
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
                const slotsLeftForTask = Math.max(0, Number(task.required_volunteers || 0) - Number(task.assigned_count || 0));

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
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {taskConfig.label}
                        </span>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:hidden">Capacity</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{task.required_volunteers} needed</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{task.assigned_count || 0} assigned</span>
                          <span className={`rounded-full px-3 py-1.5 ${slotsLeftForTask > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {slotsLeftForTask} slot{slotsLeftForTask === 1 ? '' : 's'} left
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

      <div className="mb-4 grid grid-cols-2 gap-3">
        {mission.mission_date && (
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="mb-0.5 text-xs font-medium text-slate-400">Date</p>
            <p className="text-sm font-semibold text-slate-700">{formatDate(mission.mission_date)}</p>
          </div>
        )}
        {mission.location && (
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="mb-0.5 text-xs font-medium text-slate-400">Location</p>
            <p className="truncate text-sm font-semibold text-slate-700">{mission.location}</p>
          </div>
        )}
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="mb-0.5 text-xs font-medium text-slate-400">Volunteers needed</p>
          <p className="text-sm font-semibold text-slate-700">{mission.required_volunteers}</p>
        </div>
        <div className={`rounded-lg px-3 py-2 ${spotsLeft > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`mb-0.5 text-xs font-medium ${spotsLeft > 0 ? 'text-emerald-600' : 'text-red-500'}`}>Spots available</p>
          <p className={`text-sm font-semibold ${spotsLeft > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {Math.max(0, spotsLeft)} left
          </p>
        </div>
      </div>

      {mission.required_volunteers > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>{mission.assigned_count || 0} assigned</span>
            <span>{mission.required_volunteers} needed</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
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
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
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
        <p className="py-1 text-center text-xs font-medium text-amber-600">
          Only volunteer accounts can apply
        </p>
      )}
      {!hasAssignedTask && !isAccepted && mission.status === 'open' && spotsLeft > 0 && !hasApplied && (!isAuthenticated || viewerRole === 'volunteer') && (
        <Button variant="primary" size="sm" className="w-full" onClick={() => onParticipate(mission)} loading={applying}>
          {applying ? 'Submitting application...' : 'Apply to participate'}
        </Button>
      )}
      {!hasAssignedTask && !isAccepted && (mission.status !== 'open' || spotsLeft <= 0) && (
        <p className="py-1 text-center text-xs font-medium text-slate-400">
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
  const [donationForm, setDonationForm] = useState(() => createDonationForm(user));
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [donationContact, setDonationContact] = useState(null);
  const [organizerMotivation, setOrganizerMotivation] = useState('');
  const [organizerExperience, setOrganizerExperience] = useState('');
  const [isSubmittingOrganizerApplication, setIsSubmittingOrganizerApplication] = useState(false);
  const mapsUrl = campaign ? getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude) : null;
  const hasCoordinates = campaign && Number.isFinite(Number(campaign.latitude)) && Number.isFinite(Number(campaign.longitude));
  const mapPosition = hasCoordinates ? [Number(campaign.latitude), Number(campaign.longitude)] : null;
  const donationsOpen = campaign?.status === 'active';
  const organizerApplicationStatus = campaign?.organizer_application_status;
  const isCampaignOrganizer = !!campaign?.is_campaign_organizer;

  useEffect(() => {
    setDonationForm((current) => ({
      ...current,
      donor_name: current.donor_name || user?.name || '',
      donor_email: current.donor_email || user?.email || '',
    }));
  }, [user?.email, user?.name]);

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
    setApplyingMissionId(selectedMission.id);
    try {
      const response = await campaignAPI.applyToMission(id, selectedMission.id, { motivation });
      toast.success(response.data.message || `Application submitted for "${selectedMission.title}".`);
      handleCloseModal();
      await refetch();
    } catch (applyError) {
      toast.error(applyError.response?.data?.message || 'Could not submit your application.');
    } finally {
      setIsSubmitting(false);
      setApplyingMissionId(null);
    }
  };

  const handleParticipate = (mission) => {
    handleOpenMotivationModal(mission);
  };

  const handleDonationChange = (event) => {
    const { name, value } = event.target;
    setDonationForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'type' && value === 'material' ? { amount: '' } : {}),
    }));
  };

  const handleSubmitDonation = async (event) => {
    event.preventDefault();

    if (!donationForm.donor_name.trim() || !donationForm.donor_email.trim()) {
      toast.error('Please provide your name and email before sending a donation.');
      return;
    }

    if (donationForm.type === 'financial' && !donationForm.amount) {
      toast.error('Please provide the financial amount you want to contribute.');
      return;
    }

    if (donationForm.type === 'material' && !donationForm.description.trim()) {
      toast.error('Please describe the items or material support you want to offer.');
      return;
    }

    setIsSubmittingDonation(true);
    try {
      const response = await campaignAPI.createDonation(id, donationForm);
      const organizerContact = response.data.data?.organizerContact || null;
      setDonationContact(organizerContact);
      toast.success(response.data.message || 'Donation submitted successfully.');
      setDonationForm((current) => ({
        donor_name: current.donor_name,
        donor_email: current.donor_email,
        type: 'financial',
        amount: '',
        description: '',
      }));
    } catch (submitError) {
      toast.error(submitError.response?.data?.message || 'Could not submit your donation right now.');
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const handleSubmitOrganizerApplication = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in to apply as an organizer.');
      navigate('/login', { state: { from: { pathname: `/campaigns/${id}` } } });
      return;
    }

    if (user?.role !== 'volunteer') {
      toast.error('Only volunteer accounts can apply to organize campaigns.');
      return;
    }

    if (!organizerMotivation.trim()) {
      toast.error('Please explain why you want to organize this campaign.');
      return;
    }

    setIsSubmittingOrganizerApplication(true);
    try {
      const response = await campaignAPI.applyToOrganize(id, {
        motivation: organizerMotivation,
        experience: organizerExperience,
      });
      toast.success(response.data.message || 'Organizer application submitted.');
      setOrganizerMotivation('');
      setOrganizerExperience('');
      await refetch();
    } catch (applyError) {
      toast.error(applyError.response?.data?.message || 'Could not submit your organizer application.');
    } finally {
      setIsSubmittingOrganizerApplication(false);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-900">Campaign not found</h2>
          <p className="mb-6 text-slate-500">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/')} icon={<BackIcon />}>Back to campaigns</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="group mb-8 flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <BackIcon />
          <span className="transition-transform group-hover:-translate-x-0.5">Back to campaigns</span>
        </button>

        {loading ? (
          <SkeletonDetailPage />
        ) : campaign ? (
          <div className="animate-fade-in">
            <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
              {campaign.image_url && (
                <div className="relative h-72 bg-slate-100 sm:h-80">
                  <img
                    src={getAssetUrl(campaign.image_url)}
                    alt={campaign.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />
                </div>
              )}

              <div className="p-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
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
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      Open in Google Maps
                    </a>
                  )}
                </div>

                <h1 className="mb-4 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                  {campaign.title}
                </h1>

                {campaign.description && (
                  <p className="mb-6 max-w-3xl text-base leading-relaxed text-slate-600">
                    {campaign.description}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow
                    icon={(
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    label="Location"
                    value={campaign.location}
                  />
                  <InfoRow
                    icon={(
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    label="Campaign period"
                    value={formatDateRange(campaign.start_date, campaign.end_date)}
                  />
                  <InfoRow
                    icon={(
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    label="Organizer"
                    value={campaign.organizer_names || campaign.organizer_name}
                  />
                </div>
              </div>
            </div>

            <div id="become-organizer" className="mb-8 scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-8 shadow-card">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Become an organizer</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Volunteers can request organizer access for this campaign and help coordinate its missions.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {campaign.organizer_count || 1} organizer{Number(campaign.organizer_count || 1) === 1 ? '' : 's'}
                </span>
              </div>

              {isCampaignOrganizer ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
                  You are already an organizer for this campaign.
                </div>
              ) : organizerApplicationStatus ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
                  Your organizer application is {organizerApplicationStatus}.
                </div>
              ) : (
                <form onSubmit={handleSubmitOrganizerApplication} className="space-y-4">
                  <div>
                    <label htmlFor="organizer-motivation" className="text-sm font-semibold text-slate-700">Motivation</label>
                    <textarea
                      id="organizer-motivation"
                      value={organizerMotivation}
                      onChange={(event) => setOrganizerMotivation(event.target.value)}
                      rows={4}
                      placeholder="Why do you want to help organize this campaign?"
                      className="input-field mt-1.5 resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizer-experience" className="text-sm font-semibold text-slate-700">Experience</label>
                    <textarea
                      id="organizer-experience"
                      value={organizerExperience}
                      onChange={(event) => setOrganizerExperience(event.target.value)}
                      rows={3}
                      placeholder="Share any volunteering, logistics, communication, or team coordination experience."
                      className="input-field mt-1.5 resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {isAuthenticated && user?.role !== 'volunteer' ? (
                      <p className="text-sm font-medium text-amber-600">Only volunteer accounts can apply.</p>
                    ) : (
                      <p className="text-sm text-slate-500">Your request will be reviewed by the campaign team.</p>
                    )}
                    <Button
                      type="submit"
                      loading={isSubmittingOrganizerApplication}
                      disabled={isSubmittingOrganizerApplication || (isAuthenticated && user?.role !== 'volunteer')}
                    >
                      {isSubmittingOrganizerApplication ? 'Submitting...' : 'Apply as organizer'}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {hasCoordinates && (
              <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                <div className="p-8 pb-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-slate-900">Campaign location</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        See exactly where this campaign is taking place.
                      </p>
                    </div>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
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

            <div className="mb-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-card">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-900">Support this campaign</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Offer funding or materials directly from the campaign page.
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${donationsOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {donationsOpen ? 'Donations open' : 'Donations closed'}
                  </span>
                </div>

                {donationsOpen ? (
                  <form onSubmit={handleSubmitDonation} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Your name"
                        name="donor_name"
                        value={donationForm.donor_name}
                        onChange={handleDonationChange}
                        placeholder="Full name"
                        required
                      />
                      <Input
                        label="Your email"
                        name="donor_email"
                        type="email"
                        value={donationForm.donor_email}
                        onChange={handleDonationChange}
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="donation-type" className="text-sm font-semibold text-slate-700">Support type</label>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {['financial', 'material'].map((type) => (
                          <label
                            key={type}
                            className={`cursor-pointer rounded-2xl border px-4 py-4 transition-colors ${
                              donationForm.type === type
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              id={`donation-type-${type}`}
                              type="radio"
                              name="type"
                              value={type}
                              checked={donationForm.type === type}
                              onChange={handleDonationChange}
                              className="sr-only"
                            />
                            <p className="font-semibold">{type === 'financial' ? 'Financial donation' : 'Material support'}</p>
                            <p className="mt-1 text-sm opacity-80">
                              {type === 'financial'
                                ? 'Share the amount you want to contribute and the organizer will contact you.'
                                : 'Describe the goods, supplies, or equipment you want to provide.'}
                            </p>
                          </label>
                        ))}
                      </div>
                    </div>

                    {donationForm.type === 'financial' ? (
                      <Input
                        label="Amount"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={donationForm.amount}
                        onChange={handleDonationChange}
                        placeholder="1500.00"
                        hint="This app records the pledge. The organizer handles the final arrangement with you."
                        required
                      />
                    ) : (
                      <div>
                        <label htmlFor="donation-description" className="text-sm font-semibold text-slate-700">Material details</label>
                        <textarea
                          id="donation-description"
                          name="description"
                          value={donationForm.description}
                          onChange={handleDonationChange}
                          rows={5}
                          placeholder="List the items, quantity, condition, or delivery notes."
                          className="input-field mt-1.5 resize-none"
                        />
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" loading={isSubmittingDonation}>
                        {isSubmittingDonation ? 'Sending donation...' : 'Send donation'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                    Donations are available only while the campaign is active. You can still follow campaign updates and missions from this page.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-card">
                <h3 className="font-display text-xl text-slate-900">How donations work here</h3>
                <div className="mt-5 space-y-4 text-sm text-slate-600">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                    Financial donations are handled as pledges. Once you submit the amount, the organizer follows up directly with you to manage the contribution.
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                    Material donations are reviewed by the team so they can confirm whether the offered items fit the campaign needs.
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                    Organizer contact: <strong className="text-slate-900">{campaign.organizer_name || 'Campaign organizer'}</strong>
                    {campaign.organizer_email ? ` (${campaign.organizer_email})` : ''}
                  </div>
                  {donationContact?.email && (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
                      Your last financial pledge was sent successfully. You can coordinate directly with {donationContact.name || campaign.organizer_name || 'the organizer'} at <strong>{donationContact.email}</strong>.
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Need a quick example?</p>
                  <p className="mt-2 text-sm leading-relaxed text-sky-800">
                    Financial pledge example: <strong>{formatAmount(2500)}</strong>. Material example: food packs, blankets, hygiene kits, or transport supplies.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Missions</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {missions.length > 0
                      ? `${missions.length} mission${missions.length !== 1 ? 's' : ''} available for this campaign`
                      : 'No missions added yet'}
                  </p>
                </div>
                {!isAuthenticated && missions.some((mission) => mission.status === 'open') && (
                  <div className="hidden items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 sm:flex">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sign in to participate
                  </div>
                )}
                {isAuthenticated && user?.role !== 'volunteer' && missions.some((mission) => mission.status === 'open') && (
                  <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 sm:flex">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.88 6.197M15 11a3 3 0 11-6 0 3 3 0 016 0zm7 10l-4.35-4.35" />
                    </svg>
                    Volunteer accounts can apply
                  </div>
                )}
              </div>

              {missions.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500">No missions have been added to this campaign yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-md animate-fade-in overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 border-b border-slate-100 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Apply to Mission</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedMission.title}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 transition-colors hover:text-slate-600"
                  disabled={isSubmitting}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label htmlFor="motivation" className="mb-2 block text-sm font-semibold text-slate-900">
                  Your Motivation <span className="text-red-500">*</span>
                </label>
                <p className="mb-3 text-xs text-slate-500">
                  Tell the organizer why you want to participate in this mission.
                </p>
                <textarea
                  id="motivation"
                  value={motivation}
                  onChange={(event) => setMotivation(event.target.value)}
                  placeholder="Share your motivation and why you're interested in this mission..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows="5"
                  disabled={isSubmitting}
                />
                <p className="mt-2 text-xs text-slate-400">
                  {motivation.length} characters
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white p-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !motivation.trim()}
              >
                {isSubmitting && (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
