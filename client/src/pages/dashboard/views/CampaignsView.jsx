import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import { useAuth } from '../../../context/AuthContext';
import { campaignAPI } from '../../../services/api';
import { formatDate, getAssetUrl, getGoogleMapsUrl, missionStatusConfig } from '../../../utils/helpers';
import MissionTasksManager from '../components/MissionTasksManager';
import {
  CampaignIcon,
  EmptyPanel,
  MapPicker,
  SectionTitle,
  campaignStatuses,
  createEmptyCampaignForm,
  createEmptyMissionForm,
  formatOptionLabel,
  missionStatuses,
} from '../components/DashboardPrimitives';

const getCampaignDateRangeError = ({ start_date, end_date }) => {
  if (start_date && end_date && end_date < start_date) {
    return 'End date must be on or after the start date.';
  }

  return '';
};

const CampaignsView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreateCampaign = user?.role === 'admin' || user?.role === 'organizer';
  const canDeleteCampaign = (campaign) => (
    isAdmin || Number(campaign.created_by) === Number(user?.id)
  );
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [busyCampaignId, setBusyCampaignId] = useState(null);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [campaignImageFile, setCampaignImageFile] = useState(null);
  const [campaignImagePreview, setCampaignImagePreview] = useState('');
  const [missionPanelCampaignId, setMissionPanelCampaignId] = useState(null);
  const [missionsByCampaign, setMissionsByCampaign] = useState({});
  const [missionForm, setMissionForm] = useState(createEmptyMissionForm());
  const [editingMissionId, setEditingMissionId] = useState(null);
  const [taskPanelMissionId, setTaskPanelMissionId] = useState(null);
  const [submittingMission, setSubmittingMission] = useState(false);
  const [loadingMissionsCampaignId, setLoadingMissionsCampaignId] = useState(null);
  const [busyMissionId, setBusyMissionId] = useState(null);
  const [campaignForm, setCampaignForm] = useState(createEmptyCampaignForm(isAdmin));
  const campaignDateRangeError = getCampaignDateRangeError(campaignForm);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await campaignAPI.getManageable();
      setCampaigns(response.data.data.campaigns || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load campaigns right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => () => {
    if (campaignImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(campaignImagePreview);
    }
  }, [campaignImagePreview]);

  const resetCampaignEditor = () => {
    setEditingCampaignId(null);
    setCampaignForm(createEmptyCampaignForm(isAdmin));
    if (campaignImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(campaignImagePreview);
    }
    setCampaignImageFile(null);
    setCampaignImagePreview('');
  };

  const resetMissionEditor = () => {
    setEditingMissionId(null);
    setMissionForm(createEmptyMissionForm());
  };

  const handleCampaignChange = (event) => {
    const { name, value } = event.target;
    setCampaignForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMissionChange = (event) => {
    const { name, value } = event.target;
    setMissionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCampaignImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setCampaignImageFile(file);

    if (campaignImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(campaignImagePreview);
    }

    setCampaignImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleMapPick = ({ lat, lng }) => {
    setCampaignForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaignId(campaign.id);
    setCampaignForm({
      title: campaign.title || '',
      description: campaign.description || '',
      location: campaign.location || '',
      latitude: campaign.latitude ?? '',
      longitude: campaign.longitude ?? '',
      start_date: campaign.start_date ? String(campaign.start_date).slice(0, 10) : '',
      end_date: campaign.end_date ? String(campaign.end_date).slice(0, 10) : '',
      status: campaign.status || 'draft',
    });

    if (campaignImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(campaignImagePreview);
    }

    setCampaignImageFile(null);
    setCampaignImagePreview(getAssetUrl(campaign.image_url) || '');
  };

  const handleSaveCampaign = async (event) => {
    event.preventDefault();
    if (campaignDateRangeError) {
      toast.error(campaignDateRangeError);
      return;
    }

    setSubmittingCampaign(true);
    try {
      const formData = new FormData();
      Object.entries(campaignForm).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });

      if (campaignImageFile) {
        formData.append('image', campaignImageFile);
      }

      const response = editingCampaignId
        ? await campaignAPI.update(editingCampaignId, formData)
        : await campaignAPI.create(formData);

      toast.success(response.data.message || `Campaign ${editingCampaignId ? 'updated' : 'created'} successfully.`);
      resetCampaignEditor();
      await loadCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not ${editingCampaignId ? 'update' : 'create'} campaign.`);
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!canDeleteCampaign(campaign)) return;
    if (!window.confirm(`Delete "${campaign.title}"? This action cannot be undone.`)) return;

    setBusyCampaignId(campaign.id);
    try {
      const response = await campaignAPI.remove(campaign.id);
      toast.success(response.data.message || 'Campaign deleted.');
      if (editingCampaignId === campaign.id) resetCampaignEditor();
      if (missionPanelCampaignId === campaign.id) {
        setMissionPanelCampaignId(null);
        setTaskPanelMissionId(null);
        resetMissionEditor();
      }
      await loadCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete campaign.');
    } finally {
      setBusyCampaignId(null);
    }
  };

  const loadCampaignMissions = useCallback(async (campaignId) => {
    setLoadingMissionsCampaignId(campaignId);
    try {
      const response = await campaignAPI.getMissions(campaignId);
      const missions = response.data.data.missions || [];
      setMissionsByCampaign((prev) => ({ ...prev, [campaignId]: missions }));
      setCampaigns((prev) => prev.map((campaign) => (
        campaign.id === campaignId ? { ...campaign, mission_count: missions.length } : campaign
      )));
      return missions;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load missions for this campaign.');
      return null;
    } finally {
      setLoadingMissionsCampaignId(null);
    }
  }, []);

  const handleToggleMissionManager = async (campaign) => {
    if (missionPanelCampaignId === campaign.id) {
      setMissionPanelCampaignId(null);
      setTaskPanelMissionId(null);
      resetMissionEditor();
      return;
    }

    setMissionPanelCampaignId(campaign.id);
    setTaskPanelMissionId(null);
    resetMissionEditor();
    await loadCampaignMissions(campaign.id);
  };

  const handleEditMission = (campaignId, mission) => {
    setMissionPanelCampaignId(campaignId);
    setEditingMissionId(mission.id);
    setMissionForm({
      title: mission.title || '',
      description: mission.description || '',
      required_volunteers: String(mission.required_volunteers ?? 1),
      location: mission.location || '',
      mission_date: mission.mission_date ? String(mission.mission_date).slice(0, 10) : '',
      status: mission.status || 'open',
    });
  };

  const handleSaveMission = async (campaignId, event) => {
    event.preventDefault();
    setSubmittingMission(true);
    try {
      const payload = {
        ...missionForm,
        required_volunteers: missionForm.required_volunteers || '1',
      };

      const response = editingMissionId
        ? await campaignAPI.updateMission(campaignId, editingMissionId, payload)
        : await campaignAPI.createMission(campaignId, payload);

      toast.success(response.data.message || `Mission ${editingMissionId ? 'updated' : 'created'} successfully.`);
      resetMissionEditor();
      await loadCampaignMissions(campaignId);
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not ${editingMissionId ? 'update' : 'create'} mission.`);
    } finally {
      setSubmittingMission(false);
    }
  };

  const handleMissionStatusChange = async (campaignId, missionId, status) => {
    setBusyMissionId(missionId);
    try {
      const response = await campaignAPI.updateMissionStatus(campaignId, missionId, { status });
      toast.success(response.data.message || 'Mission status updated.');
      await loadCampaignMissions(campaignId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update mission status.');
    } finally {
      setBusyMissionId(null);
    }
  };

  const handleDeleteMission = async (campaignId, mission) => {
    if (!window.confirm(`Delete mission "${mission.title}"? This action cannot be undone.`)) return;

    setBusyMissionId(mission.id);
    try {
      const response = await campaignAPI.removeMission(campaignId, mission.id);
      toast.success(response.data.message || 'Mission deleted.');
      if (editingMissionId === mission.id) resetMissionEditor();
      if (taskPanelMissionId === mission.id) setTaskPanelMissionId(null);
      await loadCampaignMissions(campaignId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete mission.');
    } finally {
      setBusyMissionId(null);
    }
  };

  const handleToggleTaskManager = (missionId) => {
    setTaskPanelMissionId((currentMissionId) => (
      currentMissionId === missionId ? null : missionId
    ));
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <SectionTitle
            title={isAdmin ? 'Campaigns' : 'Your campaigns'}
            subtitle={editingCampaignId
              ? 'Refine an existing campaign, swap its cover image, and keep the public details current.'
              : canCreateCampaign
                ? 'Create a campaign and start shaping the missions volunteers will see.'
                : 'Edit the campaigns where you were accepted as an organizer.'}
            action={<Button variant="secondary" onClick={loadCampaigns}>Refresh</Button>}
          />

          {!canCreateCampaign && !editingCampaignId ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              Choose a managed campaign below and press Edit to update its details. Creating new campaigns is still reserved for admins and global organizer accounts.
            </div>
          ) : (
          <form onSubmit={handleSaveCampaign} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Campaign title"
                name="title"
                value={campaignForm.title}
                onChange={handleCampaignChange}
                placeholder="Community food drive"
                icon={<CampaignIcon />}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="campaign-image" className="text-sm font-semibold text-slate-700">Cover photo</label>
              <div className="mt-1.5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <input
                  id="campaign-image"
                  name="campaign-image"
                  type="file"
                  accept="image/*"
                  onChange={handleCampaignImageChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-700"
                />
                <p className="mt-2 text-xs text-slate-400">Upload a JPG, PNG, or WebP image up to 5 MB.</p>
                {campaignImagePreview && (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                    <img src={campaignImagePreview} alt="Campaign preview" className="h-56 w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</label>
              <textarea
                id="description"
                name="description"
                value={campaignForm.description}
                onChange={handleCampaignChange}
                rows={4}
                placeholder="Describe the campaign goals, audience, and what volunteers will support."
                className="input-field mt-1.5 resize-none"
              />
            </div>
            <Input
              label="Location"
              name="location"
              value={campaignForm.location}
              onChange={handleCampaignChange}
              placeholder="Casablanca, community center"
            />
            <Input
              label="Latitude"
              name="latitude"
              value={campaignForm.latitude}
              onChange={handleCampaignChange}
              placeholder="33.5731"
            />
            <Input
              label="Longitude"
              name="longitude"
              value={campaignForm.longitude}
              onChange={handleCampaignChange}
              placeholder="-7.5898"
            />
            <div>
              <label htmlFor="status" className="text-sm font-semibold text-slate-700">Initial status</label>
              <select
                id="status"
                name="status"
                value={campaignForm.status}
                onChange={handleCampaignChange}
                className="input-field mt-1.5"
              >
                {campaignStatuses.map((status) => (
                  <option key={status} value={status}>{formatOptionLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Pick exact place on the map</label>
              <p className="mt-1 text-xs text-slate-400">Click on the map or drag the marker to save latitude and longitude for this campaign.</p>
              <div className="mt-3">
                <MapPicker latitude={campaignForm.latitude} longitude={campaignForm.longitude} onPick={handleMapPick} />
              </div>
            </div>
            <div>
              <label htmlFor="start_date" className="text-sm font-semibold text-slate-700">Start date</label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={campaignForm.start_date}
                onChange={handleCampaignChange}
                className="input-field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="text-sm font-semibold text-slate-700">End date</label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                min={campaignForm.start_date || undefined}
                value={campaignForm.end_date}
                onChange={handleCampaignChange}
                className={`input-field mt-1.5 ${campaignDateRangeError ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
              {campaignDateRangeError && (
                <p className="mt-2 text-xs font-semibold text-red-600">{campaignDateRangeError}</p>
              )}
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <div className="flex gap-3">
                {editingCampaignId && (
                  <Button type="button" variant="secondary" onClick={resetCampaignEditor}>
                    Cancel edit
                  </Button>
                )}
                <Button type="submit" loading={submittingCampaign} disabled={!!campaignDateRangeError}>
                  {submittingCampaign ? 'Saving campaign...' : editingCampaignId ? 'Update campaign' : 'Create campaign'}
                </Button>
              </div>
            </div>
          </form>
          )}
        </Card>

        <Card className="relative overflow-hidden border-slate-900 bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_#34d399,_transparent_35%),radial-gradient(circle_at_bottom_left,_#38bdf8,_transparent_28%)]" />
          <div className="relative">
            <SectionTitle
              title="Campaign studio notes"
              subtitle="This page is for building the campaign itself: details, imagery, maps, and attached missions."
            />
            <div className="space-y-4 text-sm text-slate-200">
              <div className="rounded-3xl bg-white/10 p-4">
                Campaigns you manage here automatically appear in the public experience once their status is active.
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                Use the mission manager inside each campaign card to add volunteer work items with dates, capacity, and mission statuses.
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                Use the Campaign Control page when you want to review approval requests and move campaigns through workflow states.
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle
          title="Managed campaigns"
          subtitle="Each card opens its own mission manager so you can edit campaign details without leaving the page."
        />
        {loading ? (
          <Card className="px-6 py-5 text-sm text-slate-500">Loading campaigns...</Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaigns.length ? campaigns.map((campaign) => {
              const isMissionPanelOpen = missionPanelCampaignId === campaign.id;
              const campaignMissions = missionsByCampaign[campaign.id] || [];

              return (
                <Card key={campaign.id} className="border border-slate-100">
                  {campaign.image_url && (
                    <div className="-mx-6 -mt-6 mb-5 h-44 overflow-hidden rounded-t-2xl bg-slate-100">
                      <img src={getAssetUrl(campaign.image_url)} alt={campaign.title} className="h-full w-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-xl text-slate-900">{campaign.title}</h3>
                        <Badge status={campaign.status} />
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {campaign.mission_count || 0} mission{campaign.mission_count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        {campaign.description || 'No description yet. Add one to give your team clearer direction.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-slate-400">Location</p>
                      {getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude) ? (
                        <a
                          href={getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block font-semibold text-emerald-700 hover:underline"
                        >
                          {campaign.location || 'Open in Google Maps'}
                        </a>
                      ) : (
                        <p className="mt-1 font-semibold text-slate-700">{campaign.location || 'Pending'}</p>
                      )}
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-slate-400">Organizer</p>
                      <p className="mt-1 font-semibold text-slate-700">{campaign.organizer_name || 'Unknown'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-slate-400">Public page</p>
                      <Link to={`/campaigns/${campaign.id}`} className="mt-1 inline-block font-semibold text-slate-700 hover:text-emerald-700">
                        Open campaign details
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => handleEditCampaign(campaign)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant={isMissionPanelOpen ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleMissionManager(campaign)}
                    >
                      {isMissionPanelOpen ? 'Hide missions' : 'Manage missions'}
                    </Button>
                    {canDeleteCampaign(campaign) && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={busyCampaignId === campaign.id}
                        onClick={() => handleDeleteCampaign(campaign)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>

                  {isMissionPanelOpen && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-display text-xl text-slate-900">{editingMissionId ? 'Edit mission' : 'Add mission'}</h4>
                            <p className="text-sm text-slate-500">
                              Create volunteer work items that will appear on the public campaign detail page.
                            </p>
                          </div>
                          {editingMissionId && (
                            <Button type="button" variant="secondary" size="sm" onClick={resetMissionEditor}>
                              Cancel mission edit
                            </Button>
                          )}
                        </div>

                        <form onSubmit={(event) => handleSaveMission(campaign.id, event)} className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <Input
                              label="Mission title"
                              name="title"
                              value={missionForm.title}
                              onChange={handleMissionChange}
                              placeholder="Food package distribution"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor={`mission-description-${campaign.id}`} className="text-sm font-semibold text-slate-700">Description</label>
                            <textarea
                              id={`mission-description-${campaign.id}`}
                              name="description"
                              value={missionForm.description}
                              onChange={handleMissionChange}
                              rows={3}
                              placeholder="Describe what volunteers will do during this mission."
                              className="input-field mt-1.5 resize-none"
                            />
                          </div>
                          <Input
                            label="Volunteers needed"
                            name="required_volunteers"
                            type="number"
                            min="1"
                            value={missionForm.required_volunteers}
                            onChange={handleMissionChange}
                            placeholder="12"
                            required
                          />
                          <Input
                            label="Mission location"
                            name="location"
                            value={missionForm.location}
                            onChange={handleMissionChange}
                            placeholder="Tahanaout collection point"
                          />
                          <div>
                            <label htmlFor={`mission-date-${campaign.id}`} className="text-sm font-semibold text-slate-700">Mission date</label>
                            <input
                              id={`mission-date-${campaign.id}`}
                              name="mission_date"
                              type="date"
                              value={missionForm.mission_date}
                              onChange={handleMissionChange}
                              className="input-field mt-1.5"
                            />
                          </div>
                          <div>
                            <label htmlFor={`mission-status-${campaign.id}`} className="text-sm font-semibold text-slate-700">Status</label>
                            <select
                              id={`mission-status-${campaign.id}`}
                              name="status"
                              value={missionForm.status}
                              onChange={handleMissionChange}
                              className="input-field mt-1.5"
                            >
                              {missionStatuses.map((status) => (
                                <option key={status} value={status}>{formatOptionLabel(status)}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" loading={submittingMission}>
                              {submittingMission ? 'Saving mission...' : editingMissionId ? 'Update mission' : 'Create mission'}
                            </Button>
                          </div>
                        </form>
                      </div>

                      <div className="mt-5">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-display text-xl text-slate-900">Current missions</h4>
                            <p className="text-sm text-slate-500">
                              {loadingMissionsCampaignId === campaign.id
                                ? 'Refreshing mission data...'
                                : `${campaignMissions.length} mission${campaignMissions.length === 1 ? '' : 's'} connected to this campaign.`}
                            </p>
                          </div>
                        </div>

                        {loadingMissionsCampaignId === campaign.id ? (
                          <Card className="px-4 py-5 text-sm text-slate-500">Loading missions...</Card>
                        ) : campaignMissions.length ? (
                          <div className="space-y-3">
                            {campaignMissions.map((mission) => {
                              const missionBadge = missionStatusConfig[mission.status] || missionStatusConfig.open;
                              const spotsLeft = Math.max(0, (mission.required_volunteers || 0) - (mission.assigned_count || 0));
                              const isTaskPanelOpen = taskPanelMissionId === mission.id;

                              return (
                                <div key={mission.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-semibold text-slate-900">{mission.title}</p>
                                          <span className={`badge ${missionBadge.className}`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                            {missionBadge.label}
                                          </span>
                                        </div>
                                        {mission.description && (
                                          <p className="mt-2 text-sm leading-relaxed text-slate-500">{mission.description}</p>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="secondary" size="sm" onClick={() => handleEditMission(campaign.id, mission)}>
                                          Edit mission
                                        </Button>
                                        <Button type="button" variant={isTaskPanelOpen ? 'primary' : 'secondary'} size="sm" onClick={() => handleToggleTaskManager(mission.id)}>
                                          {isTaskPanelOpen ? 'Hide tasks' : 'Manage tasks'}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="danger"
                                          size="sm"
                                          loading={busyMissionId === mission.id}
                                          onClick={() => handleDeleteMission(campaign.id, mission)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs">
                                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{mission.location || 'Location TBD'}</span>
                                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{mission.mission_date ? formatDate(mission.mission_date) : 'Date TBD'}</span>
                                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{mission.required_volunteers} needed</span>
                                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{mission.assigned_count || 0} assigned</span>
                                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{mission.task_count || 0} tasks</span>
                                      <span className={`rounded-full px-3 py-1.5 ${spotsLeft > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {spotsLeft} spots left
                                      </span>
                                      {(mission.pending_applications || 0) > 0 && (
                                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                                          {mission.pending_applications} pending applications
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {missionStatuses.map((status) => (
                                        <button
                                          key={status}
                                          type="button"
                                          disabled={busyMissionId === mission.id || mission.status === status}
                                          onClick={() => handleMissionStatusChange(campaign.id, mission.id, status)}
                                          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                                            mission.status === status
                                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                          }`}
                                        >
                                          {busyMissionId === mission.id && mission.status !== status ? 'Updating...' : formatOptionLabel(status)}
                                        </button>
                                      ))}
                                    </div>

                                    {isTaskPanelOpen && (
                                      <MissionTasksManager
                                        campaignId={campaign.id}
                                        mission={mission}
                                        onTasksChanged={() => loadCampaignMissions(campaign.id)}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <EmptyPanel
                            title="No missions for this campaign yet"
                            description="Create the first mission above and it will start appearing on the public campaign detail page."
                          />
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            }) : <EmptyPanel title="No managed campaigns yet" description="Create your first campaign above and it will appear here for mission planning." />}
          </div>
        )}
      </section>
    </div>
  );
};

export default CampaignsView;
