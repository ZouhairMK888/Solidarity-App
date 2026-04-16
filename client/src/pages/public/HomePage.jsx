import { useState, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import CampaignCard from '../../components/ui/CampaignCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { useCampaigns } from '../../hooks';

const statuses = ['all', 'active', 'draft', 'completed', 'cancelled'];
const statusLabels = { all: 'All', active: 'Active', draft: 'Draft', completed: 'Completed', cancelled: 'Cancelled' };

const impactStats = [
  { value: '24/7', label: 'Community access', detail: 'Discover campaigns whenever you are ready to help.' },
  { value: '3', label: 'Core roles', detail: 'Admins, organizers, and volunteers working in one flow.' },
  { value: '100%', label: 'Local focus', detail: 'Designed for practical action in real neighborhoods.' },
];

const steps = [
  {
    title: 'Discover a campaign',
    description: 'Browse initiatives by status, location, date, and mission availability.',
  },
  {
    title: 'Understand the place',
    description: 'Open the details page to see photos, location, map, missions, and organizer information.',
  },
  {
    title: 'Show up with purpose',
    description: 'Volunteers can follow active campaigns while organizers coordinate the work behind the scenes.',
  },
];

const places = [
  'Neighborhood centers',
  'Schools and youth spaces',
  'Food support points',
  'Health awareness events',
  'Emergency support areas',
  'Public community spaces',
];

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const EmptyState = ({ search, status, onReset }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <h3 className="font-display font-bold text-slate-800 text-xl mb-2">No campaigns found</h3>
    <p className="text-slate-500 text-sm mb-6 max-w-xs">
      {search ? `No results for "${search}".` : `No ${status !== 'all' ? status : ''} campaigns available yet.`}
    </p>
    <Button variant="secondary" onClick={onReset}>Clear filters</Button>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="font-display font-bold text-slate-800 text-xl mb-2">Something went wrong</h3>
    <p className="text-slate-500 text-sm mb-6">{message}</p>
    <Button variant="secondary" onClick={onRetry}>Try again</Button>
  </div>
);

const Pagination = ({ pagination, onPage }) => {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-10">
      <p className="text-sm text-slate-500">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong> - {total} campaigns
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

const SectionHeading = ({ eyebrow, title, description }) => (
  <div className="max-w-2xl">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 mb-3">{eyebrow}</p>
    <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-950 leading-tight">{title}</h2>
    {description && <p className="mt-4 text-slate-500 leading-relaxed">{description}</p>}
  </div>
);

const HomePage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  const { campaigns, pagination, loading, error, params, updateParams, goToPage, refetch } = useCampaigns({ limit: 12 });

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    updateParams({ search: searchInput || undefined, status: activeStatus !== 'all' ? activeStatus : undefined });
  }, [searchInput, activeStatus, updateParams]);

  const handleStatusFilter = useCallback((status) => {
    setActiveStatus(status);
    updateParams({ status: status !== 'all' ? status : undefined, search: searchInput || undefined });
  }, [searchInput, updateParams]);

  const handleReset = () => {
    setSearchInput('');
    setActiveStatus('all');
    updateParams({ search: undefined, status: undefined });
  };

  return (
    <Layout>
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_30%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Community Impact Platform
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-950 leading-[0.95] mb-6">
                Join a campaign, change a life.
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
                Discover active solidarity campaigns in your area, understand where help is needed, and connect with missions that make local action easier to organize.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href="#campaigns" className="btn-primary">
                  Explore campaigns <ArrowIcon />
                </a>
                <a href="#how-it-works" className="btn-secondary">
                  How it works
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-emerald-200/40 blur-3xl" />
              <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card-hover">
                <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white overflow-hidden relative">
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.55),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.28),_transparent_30%)]" />
                  <div className="relative">
                    <p className="text-sm text-emerald-200 font-semibold">Live coordination</p>
                    <h2 className="mt-3 font-display text-3xl font-bold">From local need to organized help.</h2>
                    <div className="mt-8 space-y-3">
                      {['Campaign published', 'Volunteers discover missions', 'Organizers manage progress'].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400 text-sm font-bold text-slate-950">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-100">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {impactStats.map((stat) => (
            <div key={stat.label} className="card p-6">
              <p className="font-display text-4xl font-bold text-slate-950">{stat.value}</p>
              <p className="mt-2 font-semibold text-slate-800">{stat.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <SectionHeading
            eyebrow="How it works"
            title="Simple enough for volunteers. Structured enough for organizers."
            description="The platform keeps discovery public and easy, while giving admins and organizers the tools they need to manage campaigns behind the scenes."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-sm">
                  {index + 1}
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="places" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow="Places"
            title="Built for the real places where communities gather."
            description="Campaigns can include photos, map locations, dates, and missions so volunteers understand the context before they participate."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {places.map((place) => (
              <div key={place} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">{place}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300 mb-3">About Solidarity</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                A professional space for social impact teams and everyday volunteers.
              </h2>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300 leading-relaxed">
                Solidarity brings public campaign discovery, organizer tools, admin controls, notifications, maps, photos, and mission management into one flexible platform. It is designed to feel clear for volunteers and powerful for the people coordinating the work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="campaigns" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
          <SectionHeading
            eyebrow="Campaigns"
            title="Find a campaign that needs your help."
            description="Search by campaign name, description, or location. Use filters to understand what is active, planned, completed, or cancelled."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search campaigns by title, description or location..."
                className="input-field pl-10"
              />
            </div>
            <Button type="submit" variant="primary">Search</Button>
          </form>
        </div>

        <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeStatus === status
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        {!loading && !error && campaigns.length > 0 && (
          <p className="text-sm text-slate-500 mb-6">
            Showing <strong className="text-slate-700">{campaigns.length}</strong> of{' '}
            <strong className="text-slate-700">{pagination.total}</strong> campaigns
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : campaigns.length === 0 ? (
            <EmptyState search={params.search} status={activeStatus} onReset={handleReset} />
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="animate-fade-in">
                <CampaignCard campaign={campaign} />
              </div>
            ))
          )}
        </div>

        {!loading && !error && <Pagination pagination={pagination} onPage={goToPage} />}
      </section>
    </Layout>
  );
};

export default HomePage;
