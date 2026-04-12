import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useAuth } from '../../../context/AuthContext';
import { adminAPI, campaignAPI } from '../../../services/api';
import { formatDate, getAssetUrl, getGoogleMapsUrl } from '../../../utils/helpers';
import {
  EmptyPanel,
  SectionTitle,
  campaignStatuses,
  formatOptionLabel,
} from '../components/DashboardPrimitives';

const applicationStatusToneMap = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const CampaignControlView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [busyCampaignId, setBusyCampaignId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsFilter, setApplicationsFilter] = useState('pending');
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [busyApplicationId, setBusyApplicationId] = useState(null);

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const response = await campaignAPI.getManageable();
      setCampaigns(response.data.data.campaigns || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load campaigns right now.');
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  const loadApplications = useCallback(async (status = applicationsFilter) => {
    if (!isAdmin) {
      setApplications([]);
      setLoadingApplications(false);
      return;
    }

    setLoadingApplications(true);
    try {
      const response = await adminAPI.getMissionApplications({ status });
      setApplications(response.data.data.applications || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load mission requests right now.');
    } finally {
      setLoadingApplications(false);
    }
  }, [applicationsFilter, isAdmin]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    loadApplications(applicationsFilter);
  }, [applicationsFilter, loadApplications]);

  const pendingCount = useMemo(
    () => applications.filter((application) => application.status === 'pending').length,
    [applications]
  );

  const handleCampaignStatusChange = async (campaignId, status) => {
    setBusyCampaignId(campaignId);
    try {
      const response = await campaignAPI.updateStatus(campaignId, { status });
      toast.success(response.data.message || 'Campaign updated.');
      await loadCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update campaign status.');
    } finally {
      setBusyCampaignId(null);
    }
  };

  const handleReviewApplication = async (applicationId, status) => {
    setBusyApplicationId(applicationId);
    try {
      const response = await adminAPI.reviewMissionApplication(applicationId, { status });
      toast.success(response.data.message || `Application ${status}.`);
      await loadApplications(applicationsFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not ${status === 'accepted' ? 'accept' : 'reject'} this application.`);
    } finally {
      setBusyApplicationId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="relative overflow-hidden border-slate-900 bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_#34d399,_transparent_35%),radial-gradient(circle_at_bottom_left,_#f59e0b,_transparent_28%)]" />
          <div className="relative">
            <SectionTitle
              title="Campaign control"
              subtitle="Move campaigns through workflow states without opening the editor."
            />
            <div className="space-y-4 text-sm text-slate-200">
              <div className="rounded-3xl bg-white/10 p-4">Use this page when you are reviewing campaign readiness, promoting drafts to active campaigns, or closing completed work.</div>
              <div className="rounded-3xl bg-white/10 p-4">Admins also get the mission request queue here, so approvals stay close to the campaigns they affect.</div>
              <div className="rounded-3xl bg-white/10 p-4">Accepted volunteer requests automatically create a task assignment for the mission.</div>
            </div>
          </div>
        </Card>

        {isAdmin ? (
          <Card>
            <SectionTitle
              title="Mission request queue"
              subtitle="Review volunteer applications and decide who should be assigned next."
            />
            <div className="rounded-3xl bg-amber-50 px-5 py-4 text-sm text-amber-700">
              {pendingCount} pending request{pendingCount === 1 ? '' : 's'} in the currently loaded view.
            </div>
          </Card>
        ) : (
          <Card>
            <SectionTitle
              title="Control notes"
              subtitle="Organizers can manage campaign states here while admins keep approval decisions centralized."
            />
            <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
              Status controls stay on this page so your campaign editor remains focused on content and missions.
            </div>
          </Card>
        )}
      </section>

      <section>
        <SectionTitle
          title="Campaign workflow"
          subtitle="Quick status changes for every campaign you are allowed to manage."
        />

        {loadingCampaigns ? (
          <Card className="px-6 py-5 text-sm text-slate-500">Loading campaigns...</Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {campaigns.length ? campaigns.map((campaign) => (
              <Card key={campaign.id}>
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
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{campaign.description || 'No description yet.'}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-slate-400">Location</p>
                    {getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude) ? (
                      <a href={getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude)} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-emerald-700 hover:underline">
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
                      Open details
                    </Link>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {campaignStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busyCampaignId === campaign.id || campaign.status === status}
                      onClick={() => handleCampaignStatusChange(campaign.id, status)}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                        campaign.status === status
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {busyCampaignId === campaign.id && campaign.status !== status ? 'Updating...' : formatOptionLabel(status)}
                    </button>
                  ))}
                </div>
              </Card>
            )) : <EmptyPanel title="No campaigns available" description="Create a campaign first and it will appear here for workflow control." />}
          </div>
        )}
      </section>

      {isAdmin && (
        <section>
          <SectionTitle
            title="Volunteer mission requests"
            subtitle="Accept or reject mission applications without digging through each campaign card."
            action={
              <div className="w-full sm:w-60">
                <label htmlFor="application-filter" className="text-sm font-semibold text-slate-700">Filter</label>
                <select
                  id="application-filter"
                  value={applicationsFilter}
                  onChange={(event) => setApplicationsFilter(event.target.value)}
                  className="input-field mt-1.5"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="all">All</option>
                </select>
              </div>
            }
          />

          {loadingApplications ? (
            <Card className="px-6 py-5 text-sm text-slate-500">Loading mission requests...</Card>
          ) : applications.length ? (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-xl text-slate-900">{application.volunteer_name}</p>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${applicationStatusToneMap[application.status] || applicationStatusToneMap.pending}`}>
                          {formatOptionLabel(application.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{application.volunteer_email}</span>
                        {application.volunteer_phone && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{application.volunteer_phone}</span>
                        )}
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                          {application.mission_title}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                          {application.campaign_title}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                          Applied {formatDate(application.applied_at)}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-slate-400">Campaign status</p>
                          <p className="mt-1 font-semibold text-slate-700">{formatOptionLabel(application.campaign_status)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-slate-400">Mission status</p>
                          <p className="mt-1 font-semibold text-slate-700">{formatOptionLabel(application.mission_status)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-slate-400">Volunteer capacity</p>
                          <p className="mt-1 font-semibold text-slate-700">{application.required_volunteers} requested spots</p>
                        </div>
                      </div>
                      {application.motivation && (
                        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Motivation</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{application.motivation}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 xl:w-48 xl:flex-col">
                      {application.status === 'pending' ? (
                        <>
                          <Button
                            type="button"
                            className="xl:w-full"
                            loading={busyApplicationId === application.id}
                            onClick={() => handleReviewApplication(application.id, 'accepted')}
                          >
                            Accept request
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            className="xl:w-full"
                            loading={busyApplicationId === application.id}
                            onClick={() => handleReviewApplication(application.id, 'rejected')}
                          >
                            Refuse request
                          </Button>
                        </>
                      ) : (
                        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                          Already {application.status}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyPanel title="No mission requests in this filter" description="Try another filter or wait for volunteers to apply to open missions." />
          )}
        </section>
      )}
    </div>
  );
};

export default CampaignControlView;
