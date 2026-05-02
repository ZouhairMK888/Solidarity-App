import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';
import { campaignAPI, donationAPI } from '../../../services/api';
import { donationStatusConfig, donationTypeConfig, formatAmount, formatDate } from '../../../utils/helpers';
import {
  CampaignIcon,
  DonationIcon,
  EmptyPanel,
  MailIcon,
  MetricCard,
  SectionTitle,
  UserIcon,
} from '../components/DashboardPrimitives';

const donationStatuses = ['pending', 'confirmed', 'rejected'];
const donationTypes = ['financial', 'material'];

const createEmptyDonationForm = () => ({
  donor_name: '',
  donor_email: '',
  type: 'financial',
  amount: '',
  description: '',
  status: 'pending',
});

const formatOptionLabel = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const DonationsView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDonation, setSavingDonation] = useState(false);
  const [busyDonationId, setBusyDonationId] = useState(null);
  const [editingDonationId, setEditingDonationId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    campaignId: 'all',
  });
  const [donationForm, setDonationForm] = useState(createEmptyDonationForm());

  const loadCampaigns = useCallback(async () => {
    try {
      const response = await campaignAPI.getManageable();
      setCampaigns(response.data.data.campaigns || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load campaigns for donation filters.');
    }
  }, []);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await donationAPI.getManageable({
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        campaignId: filters.campaignId !== 'all' ? filters.campaignId : undefined,
      });
      setDonations(response.data.data.donations || []);
      setStats(response.data.data.stats || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load donations right now.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const resetDonationEditor = () => {
    setEditingDonationId(null);
    setDonationForm(createEmptyDonationForm());
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDonationChange = (event) => {
    const { name, value } = event.target;
    setDonationForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && value === 'material' ? { amount: '' } : {}),
    }));
  };

  const handleEditDonation = (donation) => {
    setEditingDonationId(donation.id);
    setDonationForm({
      donor_name: donation.donor_name || '',
      donor_email: donation.donor_email || '',
      type: donation.type || 'financial',
      amount: donation.amount ?? '',
      description: donation.description || '',
      status: donation.status || 'pending',
    });
  };

  const handleSaveDonation = async (event) => {
    event.preventDefault();
    if (!editingDonationId) return;

    setSavingDonation(true);
    try {
      const response = await donationAPI.update(editingDonationId, donationForm);
      toast.success(response.data.message || 'Donation updated.');
      resetDonationEditor();
      await loadDonations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this donation.');
    } finally {
      setSavingDonation(false);
    }
  };

  const handleQuickStatus = async (donation, status) => {
    setBusyDonationId(donation.id);
    try {
      const response = await donationAPI.updateStatus(donation.id, { status });
      toast.success(response.data.message || 'Donation status updated.');
      if (editingDonationId === donation.id) {
        setDonationForm((prev) => ({ ...prev, status }));
      }
      await loadDonations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update donation status.');
    } finally {
      setBusyDonationId(null);
    }
  };

  const handleDeleteDonation = async (donation) => {
    if (!window.confirm(`Delete donation from "${donation.donor_name}"? This action cannot be undone.`)) return;

    setBusyDonationId(donation.id);
    try {
      const response = await donationAPI.remove(donation.id);
      toast.success(response.data.message || 'Donation deleted.');
      if (editingDonationId === donation.id) resetDonationEditor();
      await loadDonations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete this donation.');
    } finally {
      setBusyDonationId(null);
    }
  };

  const financialPipelineAmount = useMemo(
    () => formatAmount(stats?.tracked_financial_amount),
    [stats?.tracked_financial_amount]
  );

  const confirmedFinancialAmount = useMemo(
    () => formatAmount(stats?.confirmed_financial_amount),
    [stats?.confirmed_financial_amount]
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="relative overflow-hidden border-slate-900 bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_#34d399,_transparent_34%),radial-gradient(circle_at_bottom_left,_#38bdf8,_transparent_28%)]" />
          <div className="relative">
            <SectionTitle
              title="Donation workspace"
              subtitle="Track both money pledges and material offers in one polished control space."
            />
            <div className="space-y-4 text-sm text-slate-200">
              <div className="rounded-3xl bg-white/10 p-4">Financial donations stay lightweight here. Donors submit their intent, and the organizer follows up directly to handle the arrangement.</div>
              <div className="rounded-3xl bg-white/10 p-4">Material donations carry descriptive notes so your team can quickly understand what is being offered before confirming pickup or delivery.</div>
              <div className="rounded-3xl bg-white/10 p-4">{isAdmin ? 'Admins can supervise every donation across the platform.' : 'You only see donations connected to the campaigns you manage.'}</div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Pipeline snapshot"
            subtitle="Use these totals to keep campaign support moving without losing track of donor follow-up."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5">
              <p className="text-sm font-semibold text-amber-700">Pending donations</p>
              <p className="mt-3 font-display text-3xl text-slate-900">{stats?.pending_donations ?? 0}</p>
              <p className="mt-2 text-sm text-slate-500">Offers still waiting for confirmation or review.</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5">
              <p className="text-sm font-semibold text-emerald-700">Confirmed amount</p>
              <p className="mt-3 font-display text-3xl text-slate-900">{confirmedFinancialAmount}</p>
              <p className="mt-2 text-sm text-slate-500">Financial donations already marked as confirmed.</p>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Pending"
            value={stats?.pending_donations ?? 0}
            hint="Donation records waiting for an answer."
            icon={<DonationIcon />}
            tint="bg-amber-500"
          />
          <MetricCard
            label="Confirmed"
            value={stats?.confirmed_donations ?? 0}
            hint="Offers already accepted by the team."
            icon={<CampaignIcon />}
            tint="bg-emerald-500"
          />
          <MetricCard
            label="Financial pipeline"
            value={financialPipelineAmount}
            hint="Tracked financial amount across pending and confirmed pledges."
            icon={<DonationIcon />}
            tint="bg-sky-500"
          />
          <MetricCard
            label="Material offers"
            value={stats?.material_donations ?? 0}
            hint="Physical goods or supplies proposed by donors."
            icon={<MailIcon />}
            tint="bg-violet-500"
          />
        </div>
      </section>

      <section>
        <SectionTitle
          title="Donation records"
          subtitle="Filter the queue, adjust donor details when needed, and keep statuses accurate."
          action={<Button type="button" variant="secondary" onClick={loadDonations}>Refresh</Button>}
        />

        <Card>
          {editingDonationId && (
            <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-xl text-slate-900">Edit donation</h3>
                  <p className="text-sm text-slate-500">Refine donor details, change type-specific information, or adjust the review status.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={resetDonationEditor}>
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleSaveDonation} className="grid gap-4 md:grid-cols-2">
                <Input label="Donor name" name="donor_name" value={donationForm.donor_name} onChange={handleDonationChange} icon={<UserIcon />} required />
                <Input label="Donor email" name="donor_email" type="email" value={donationForm.donor_email} onChange={handleDonationChange} icon={<MailIcon />} required />
                <div>
                  <label htmlFor="donation-type" className="text-sm font-semibold text-slate-700">Donation type</label>
                  <select id="donation-type" name="type" value={donationForm.type} onChange={handleDonationChange} className="input-field mt-1.5">
                    {donationTypes.map((type) => (
                      <option key={type} value={type}>{formatOptionLabel(type)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="donation-status" className="text-sm font-semibold text-slate-700">Status</label>
                  <select id="donation-status" name="status" value={donationForm.status} onChange={handleDonationChange} className="input-field mt-1.5">
                    {donationStatuses.map((status) => (
                      <option key={status} value={status}>{formatOptionLabel(status)}</option>
                    ))}
                  </select>
                </div>
                {donationForm.type === 'financial' ? (
                  <Input label="Amount" name="amount" type="number" min="0.01" step="0.01" value={donationForm.amount} onChange={handleDonationChange} placeholder="2500.00" required />
                ) : (
                  <div className="md:col-span-2">
                    <label htmlFor="donation-description" className="text-sm font-semibold text-slate-700">Material details</label>
                    <textarea
                      id="donation-description"
                      name="description"
                      value={donationForm.description}
                      onChange={handleDonationChange}
                      rows={4}
                      placeholder="List the items, quantity, condition, or delivery notes."
                      className="input-field mt-1.5 resize-none"
                    />
                  </div>
                )}
                {donationForm.type === 'financial' && (
                  <div className="md:col-span-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Financial donations are managed through direct contact with the organizer after the pledge is reviewed.
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" loading={savingDonation}>
                    {savingDonation ? 'Saving donation...' : 'Save donation changes'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.8fr))]">
            <Input
              label="Search donations"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by donor, email, campaign, or notes"
              icon={<MailIcon />}
            />
            <div>
              <label htmlFor="filter-status" className="text-sm font-semibold text-slate-700">Status</label>
              <select id="filter-status" name="status" value={filters.status} onChange={handleFilterChange} className="input-field mt-1.5">
                <option value="all">All statuses</option>
                {donationStatuses.map((status) => (
                  <option key={status} value={status}>{formatOptionLabel(status)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-type" className="text-sm font-semibold text-slate-700">Type</label>
              <select id="filter-type" name="type" value={filters.type} onChange={handleFilterChange} className="input-field mt-1.5">
                <option value="all">All types</option>
                {donationTypes.map((type) => (
                  <option key={type} value={type}>{formatOptionLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-campaign" className="text-sm font-semibold text-slate-700">Campaign</label>
              <select id="filter-campaign" name="campaignId" value={filters.campaignId} onChange={handleFilterChange} className="input-field mt-1.5">
                <option value="all">All campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
              Loading donations...
            </div>
          ) : donations.length ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {donations.map((donation) => {
                const statusTone = donationStatusConfig[donation.status] || donationStatusConfig.pending;
                const typeTone = donationTypeConfig[donation.type] || donationTypeConfig.material;

                return (
                  <div key={donation.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-xl text-slate-900">{donation.donor_name}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone.className}`}>
                            {statusTone.label}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeTone.className}`}>
                            {typeTone.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{donation.donor_email}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {formatDate(donation.donated_at)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-slate-400">Campaign</p>
                        <p className="mt-1 font-semibold text-slate-700">{donation.campaign_title}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-slate-400">Organizer</p>
                        <p className="mt-1 font-semibold text-slate-700">{donation.organizer_name || 'Unknown'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-slate-400">{donation.type === 'financial' ? 'Amount' : 'Offer type'}</p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {donation.type === 'financial' ? formatAmount(donation.amount) : 'Material support'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {donation.type === 'financial' ? 'Coordination note' : 'Material details'}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {donation.type === 'financial'
                          ? `Follow up directly with ${donation.donor_name} at ${donation.donor_email} to coordinate the financial contribution.`
                          : donation.description || 'No description was added by the donor.'}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleEditDonation(donation)}>
                        Edit
                      </Button>
                      {donation.status !== 'confirmed' && (
                        <Button
                          type="button"
                          size="sm"
                          loading={busyDonationId === donation.id}
                          onClick={() => handleQuickStatus(donation, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
                      {donation.status !== 'rejected' && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={busyDonationId === donation.id}
                          onClick={() => handleQuickStatus(donation, 'rejected')}
                        >
                          Reject
                        </Button>
                      )}
                      {donation.status !== 'pending' && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={busyDonationId === donation.id}
                          onClick={() => handleQuickStatus(donation, 'pending')}
                        >
                          Mark pending
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={busyDonationId === donation.id}
                        onClick={() => handleDeleteDonation(donation)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pt-6">
              <EmptyPanel title="No donations match these filters" description="Try a different search term or widen the filters to bring more donation records back into view." />
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default DonationsView;
