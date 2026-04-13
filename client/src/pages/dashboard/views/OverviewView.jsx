import { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useAuth } from '../../../context/AuthContext';
import { adminAPI, campaignAPI } from '../../../services/api';
import {
  CampaignIcon,
  DashboardIcon,
  EmptyPanel,
  MetricCard,
  SectionTitle,
  SparkIcon,
  TeamIcon,
  UserIcon,
} from '../components/DashboardPrimitives';

const OverviewView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const response = await adminAPI.getOverview();
          setOverview(response.data.data);
        } else {
          const response = await campaignAPI.getManageable();
          setCampaigns(response.data.data.campaigns || []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const organizerMetrics = useMemo(() => ({
    active: campaigns.filter((campaign) => campaign.status === 'active').length,
    draft: campaigns.filter((campaign) => campaign.status === 'draft').length,
    completed: campaigns.filter((campaign) => campaign.status === 'completed').length,
    totalMissions: campaigns.reduce((sum, campaign) => sum + Number(campaign.mission_count || 0), 0),
  }), [campaigns]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(5,150,105,0.10),rgba(14,165,233,0.08),rgba(255,255,255,0.9))] p-8 shadow-card">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_40%),radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            <SparkIcon />
            {isAdmin ? 'Admin dashboard' : 'Organizer overview'}
          </div>
          <h1 className="mt-5 font-display text-4xl text-slate-900 sm:text-5xl">
            {isAdmin ? 'See requests, campaigns, and team momentum at a glance.' : 'Track the campaigns you are shaping right now.'}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {isAdmin
              ? 'Use the control pages to review volunteer requests, keep campaign statuses clean, and support organizers without getting lost in one giant screen.'
              : 'Move between planning, mission building, and campaign control through a quieter workspace built around your initiatives.'}
          </p>
        </div>
      </section>

      {loading ? (
        <Card className="px-6 py-5 text-sm text-slate-500">Loading dashboard overview...</Card>
      ) : (
        <>
          <section>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {isAdmin ? (
                <>
                  <MetricCard
                    label="Active organizers"
                    value={overview?.stats?.users?.organizers ?? '—'}
                    hint="People currently running community initiatives."
                    icon={<TeamIcon />}
                    tint="bg-blue-500"
                  />
                  <MetricCard
                    label="Active campaigns"
                    value={overview?.stats?.campaigns?.active_campaigns ?? '—'}
                    hint="Campaigns visible to volunteers right now."
                    icon={<CampaignIcon />}
                    tint="bg-emerald-500"
                  />
                  <MetricCard
                    label="Pending requests"
                    value={overview?.stats?.applications?.pending_applications ?? 0}
                    hint="Volunteer mission applications waiting for review."
                    icon={<DashboardIcon />}
                    tint="bg-amber-500"
                  />
                  <MetricCard
                    label="Active accounts"
                    value={overview?.stats?.users?.active_users ?? '—'}
                    hint="Admins, organizers, and volunteers with access."
                    icon={<UserIcon />}
                    tint="bg-slate-500"
                  />
                </>
              ) : (
                <>
                  <MetricCard
                    label="Active campaigns"
                    value={organizerMetrics.active}
                    hint="Initiatives currently visible to volunteers."
                    icon={<CampaignIcon />}
                    tint="bg-emerald-500"
                  />
                  <MetricCard
                    label="Draft campaigns"
                    value={organizerMetrics.draft}
                    hint="Projects still being prepared before launch."
                    icon={<SparkIcon />}
                    tint="bg-amber-500"
                  />
                  <MetricCard
                    label="Completed campaigns"
                    value={organizerMetrics.completed}
                    hint="Campaigns that reached their finish line."
                    icon={<DashboardIcon />}
                    tint="bg-blue-500"
                  />
                  <MetricCard
                    label="Total missions"
                    value={organizerMetrics.totalMissions}
                    hint="Volunteer opportunities across all your campaigns."
                    icon={<TeamIcon />}
                    tint="bg-slate-500"
                  />
                </>
              )}
            </div>
          </section>

          {isAdmin ? (
            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="relative overflow-hidden border-slate-900 bg-slate-900 text-white">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_#34d399,_transparent_35%),radial-gradient(circle_at_bottom_left,_#38bdf8,_transparent_28%)]" />
                <div className="relative">
                  <SectionTitle
                    title="Recent campaign activity"
                    subtitle="The newest initiatives entering the platform."
                  />
                  <div className="space-y-3">
                    {overview?.recentCampaigns?.length ? overview.recentCampaigns.map((campaign) => (
                      <div key={campaign.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{campaign.title}</p>
                            <p className="mt-1 text-sm text-slate-300">{campaign.location || 'Location to be confirmed'}</p>
                          </div>
                          <Badge status={campaign.status} />
                        </div>
                      </div>
                    )) : <EmptyPanel title="No campaigns yet" description="New campaigns will appear here as soon as organizers create them." />}
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle
                  title="Recent people"
                  subtitle="Fresh accounts that may need attention or role updates."
                />
                <div className="space-y-3">
                  {overview?.recentUsers?.length ? overview.recentUsers.map((member) => (
                    <div key={member.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-white">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  )) : <EmptyPanel title="No users yet" description="New signups and organizer accounts will appear here." />}
                </div>
              </Card>
            </section>
          ) : (
            <section>
              <SectionTitle
                title="Your recent campaigns"
                subtitle="A quick snapshot of the campaigns you are currently responsible for."
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {campaigns.length ? campaigns.slice(0, 4).map((campaign) => (
                  <Card key={campaign.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-xl text-slate-900">{campaign.title}</p>
                        <p className="mt-2 text-sm text-slate-500">{campaign.location || 'Location pending'}</p>
                      </div>
                      <Badge status={campaign.status} />
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {campaign.mission_count || 0} mission{campaign.mission_count === 1 ? '' : 's'} connected to this campaign
                    </div>
                  </Card>
                )) : <EmptyPanel title="No campaigns yet" description="Open the Campaigns page to create your first initiative." />}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default OverviewView;
