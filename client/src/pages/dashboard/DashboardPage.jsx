import { useMemo } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import CampaignControlView from './views/CampaignControlView';
import CampaignsView from './views/CampaignsView';
import DonationsView from './views/DonationsView';
import OverviewView from './views/OverviewView';
import OrganizersView from './views/OrganizersView';
import {
  CampaignIcon,
  ControlIcon,
  DashboardIcon,
  DonationIcon,
  TeamIcon,
} from './components/DashboardPrimitives';

const navigationItems = [
  {
    label: 'Dashboard',
    description: 'Overview, recent activity, and key metrics.',
    to: '/dashboard/overview',
    icon: DashboardIcon,
    roles: ['admin', 'organizer'],
  },
  {
    label: 'Campaigns',
    description: 'Create campaigns, edit them, and manage missions.',
    to: '/dashboard/campaigns',
    icon: CampaignIcon,
    roles: ['admin', 'organizer'],
  },
  {
    label: 'Campaign Control',
    description: 'Move campaign statuses and review mission requests.',
    to: '/dashboard/control',
    icon: ControlIcon,
    roles: ['admin', 'organizer'],
  },
  {
    label: 'Donations',
    description: 'Review money pledges and material support.',
    to: '/dashboard/donations',
    icon: DonationIcon,
    roles: ['admin', 'organizer'],
  },
  {
    label: 'Organizers',
    description: 'Create organizer accounts and manage platform roles.',
    to: '/dashboard/organizers',
    icon: TeamIcon,
    roles: ['admin'],
  },
];

const RailLink = ({ item }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => `group/item flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 ${
        isActive
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
          : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
      }`}
    >
      {({ isActive }) => (
        <>
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-colors ${
            isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600 group-hover/item:bg-slate-900 group-hover/item:text-white'
          }`}>
            <Icon />
          </div>
          <div className="min-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover/rail:translate-x-0 group-hover/rail:opacity-100">
            <p className="truncate text-sm font-semibold">{item.label}</p>
            <p className={`truncate text-xs ${isActive ? 'text-slate-200' : 'text-slate-400 group-hover/item:text-slate-500'}`}>
              {item.description}
            </p>
          </div>
        </>
      )}
    </NavLink>
  );
};

const MobileLink = ({ item }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => `inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon />
      {item.label}
    </NavLink>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const isCampaignOrganizer = Number(user?.campaign_organizer_count || 0) > 0;

  const visibleItems = useMemo(
    () => navigationItems.filter((item) => (
      item.roles.includes(user?.role) || (isCampaignOrganizer && item.roles.includes('organizer'))
    )),
    [isCampaignOrganizer, user?.role]
  );

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-8rem)]">
        <aside className="group/rail fixed left-0 top-24 bottom-8 z-30 hidden lg:flex items-center">
          <div className="h-[calc(100vh-8rem)] w-[17rem] -translate-x-[12.35rem] rounded-r-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,245,249,0.92))] p-3 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0">
            <div className="flex h-full flex-col gap-4 overflow-hidden">
              <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(5,150,105,0.18),rgba(14,165,233,0.12))] px-3 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <DashboardIcon />
                  </div>
                  <div className="min-w-0 opacity-0 transition-all duration-200 group-hover/rail:opacity-100">
                    <p className="truncate text-sm font-semibold text-slate-900">Control rail</p>
                    <p className="truncate text-xs text-slate-500">Hover to expand</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-2">
                {visibleItems.map((item) => (
                  <RailLink key={item.to} item={item} />
                ))}
              </nav>

              <div className="rounded-3xl border border-slate-200 bg-white/80 px-3 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 opacity-0 transition-all duration-200 group-hover/rail:opacity-100">
                    <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="truncate text-xs capitalize text-slate-500">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:pl-24 lg:pr-8 lg:py-10">
          <div className="mb-6 lg:hidden">
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/80 p-2 shadow-card backdrop-blur-sm">
              <div className="flex gap-2">
                {visibleItems.map((item) => (
                  <MobileLink key={item.to} item={item} />
                ))}
              </div>
            </div>
          </div>

          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewView />} />
            <Route path="campaigns" element={<CampaignsView />} />
            <Route path="control" element={<CampaignControlView />} />
            <Route path="donations" element={<DonationsView />} />
            <Route
              path="organizers"
              element={user?.role === 'admin' ? <OrganizersView /> : <Navigate to="/dashboard/overview" replace />}
            />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
