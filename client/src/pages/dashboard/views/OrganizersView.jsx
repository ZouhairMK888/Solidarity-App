import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { adminAPI } from '../../../services/api';
import {
  EmptyPanel,
  LockIcon,
  MailIcon,
  PhoneIcon,
  SectionTitle,
  TeamIcon,
  UserIcon,
  roleOptions,
} from '../components/DashboardPrimitives';

const roleToneMap = {
  admin: 'bg-amber-100 text-amber-700',
  organizer: 'bg-blue-100 text-blue-700',
  volunteer: 'bg-emerald-100 text-emerald-700',
};

const statusToneMap = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
};

const OrganizersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [submittingOrganizer, setSubmittingOrganizer] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [organizerForm, setOrganizerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'volunteer',
    is_active: true,
  });

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await adminAPI.getUsers();
        setUsers(response.data.data.users || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load users right now.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const visibleUsers = useMemo(() => (
    users.filter((member) => {
      const matchesRole = userRoleFilter === 'all' || member.role === userRoleFilter;
      const term = userSearch.trim().toLowerCase();
      const matchesSearch = !term || [member.name, member.email, member.phone].some((value) => value?.toLowerCase().includes(term));
      return matchesRole && matchesSearch;
    })
  ), [users, userRoleFilter, userSearch]);

  const reloadUsers = async () => {
    const response = await adminAPI.getUsers();
    setUsers(response.data.data.users || []);
  };

  const handleOrganizerChange = (event) => {
    const { name, value } = event.target;
    setOrganizerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditUser = (member) => {
    setEditingUserId(member.id);
    setUserForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'volunteer',
      is_active: !!member.is_active,
    });
  };

  const resetUserEditor = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'volunteer',
      is_active: true,
    });
  };

  const handleCreateOrganizer = async (event) => {
    event.preventDefault();
    setSubmittingOrganizer(true);
    try {
      const response = await adminAPI.createOrganizer(organizerForm);
      toast.success(response.data.message || 'Organizer account created.');
      setOrganizerForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      await reloadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create organizer.');
    } finally {
      setSubmittingOrganizer(false);
    }
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    if (!editingUserId) return;

    setSavingUser(true);
    try {
      const response = await adminAPI.updateUser(editingUserId, userForm);
      toast.success(response.data.message || 'User updated.');
      resetUserEditor();
      await reloadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update user.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserStatus = async (member) => {
    setBusyUserId(member.id);
    try {
      const response = await adminAPI.updateUserStatus(member.id, { is_active: !member.is_active });
      toast.success(response.data.message || 'User status updated.');
      await reloadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = async (member, role) => {
    setBusyUserId(member.id);
    try {
      const response = await adminAPI.updateUserRole(member.id, { role });
      toast.success(response.data.message || 'User role updated.');
      await reloadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update user role.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (member) => {
    if (!window.confirm(`Delete user "${member.name}"? This action cannot be undone.`)) return;

    setBusyUserId(member.id);
    try {
      const response = await adminAPI.deleteUser(member.id);
      toast.success(response.data.message || 'User deleted.');
      if (editingUserId === member.id) resetUserEditor();
      await reloadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete user.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionTitle
            title="Create organizer"
            subtitle="Provision organizer accounts directly from the admin workspace."
          />
          <form onSubmit={handleCreateOrganizer} className="space-y-4">
            <Input label="Organizer name" name="name" value={organizerForm.name} onChange={handleOrganizerChange} placeholder="Amine El Idrissi" icon={<UserIcon />} required />
            <Input label="Work email" name="email" type="email" value={organizerForm.email} onChange={handleOrganizerChange} placeholder="organizer@solidarity.org" icon={<MailIcon />} required />
            <Input label="Phone" name="phone" value={organizerForm.phone} onChange={handleOrganizerChange} placeholder="+212 600 000 000" icon={<PhoneIcon />} />
            <Input label="Temporary password" name="password" type="password" value={organizerForm.password} onChange={handleOrganizerChange} placeholder="At least 8 characters" icon={<LockIcon />} required />
            <Input label="Confirm password" name="confirmPassword" type="password" value={organizerForm.confirmPassword} onChange={handleOrganizerChange} placeholder="Repeat the password" icon={<LockIcon />} required />
            <Button type="submit" className="w-full" loading={submittingOrganizer}>
              {submittingOrganizer ? 'Creating organizer...' : 'Create organizer account'}
            </Button>
          </form>
        </Card>

        <Card className="relative overflow-hidden border-slate-900 bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_#f59e0b,_transparent_30%),radial-gradient(circle_at_bottom_left,_#38bdf8,_transparent_28%)]" />
          <div className="relative">
            <SectionTitle
              title="Team management notes"
              subtitle="Keep organizer access clean and the platform roles easy to understand."
            />
            <div className="space-y-4 text-sm text-slate-200">
              <div className="rounded-3xl bg-white/10 p-4">Organizers can build campaigns and missions, but only admins can create organizer accounts and review volunteer requests.</div>
              <div className="rounded-3xl bg-white/10 p-4">Use the user editor below when you need to correct names, change roles, or deactivate unused accounts.</div>
              <div className="rounded-3xl bg-white/10 p-4">A lighter admin panel is easier to scan, so this page focuses only on people and permissions.</div>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle
          title="People and roles"
          subtitle="Search the team, change organizer assignments, and pause access when needed."
        />

        <Card>
          {editingUserId && (
            <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-xl text-slate-900">Edit user</h3>
                  <p className="text-sm text-slate-500">Update profile information, role, and account state.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={resetUserEditor}>
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleSaveUser} className="grid gap-4 md:grid-cols-2">
                <Input label="Full name" name="name" value={userForm.name} onChange={handleUserFormChange} placeholder="Full name" />
                <Input label="Email" name="email" type="email" value={userForm.email} onChange={handleUserFormChange} placeholder="email@example.com" />
                <Input label="Phone" name="phone" value={userForm.phone} onChange={handleUserFormChange} placeholder="+212 ..." />
                <div>
                  <label htmlFor="user-role" className="text-sm font-semibold text-slate-700">Role</label>
                  <select id="user-role" name="role" value={userForm.role} onChange={handleUserFormChange} className="input-field mt-1.5">
                    <option value="admin">Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>
                <label className="md:col-span-2 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={userForm.is_active}
                    onChange={handleUserFormChange}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Keep this account active
                </label>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" loading={savingUser}>
                    {savingUser ? 'Saving user...' : 'Save user changes'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <Input
                label="Search users"
                name="user-search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name, email, or phone"
                icon={<MailIcon />}
              />
            </div>
            <div className="w-full lg:w-56">
              <label htmlFor="user-role-filter" className="text-sm font-semibold text-slate-700">Role filter</label>
              <select id="user-role-filter" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)} className="input-field mt-1.5">
                <option value="all">All roles</option>
                <option value="admin">Admins</option>
                <option value="organizer">Organizers</option>
                <option value="volunteer">Volunteers</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
              Loading users...
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-3 pr-4 font-semibold">User</th>
                    <th className="pb-3 pr-4 font-semibold">Role</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 pr-4 font-semibold">Created</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleUsers.map((member) => (
                    <tr key={member.id}>
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-semibold text-slate-800">{member.name}</p>
                          <p className="text-slate-500">{member.email}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleToneMap[member.role] || 'bg-slate-100 text-slate-600'}`}>
                            {member.role}
                          </span>
                          {member.role !== 'admin' && (
                            <select
                              value={member.role}
                              disabled={busyUserId === member.id}
                              onChange={(event) => handleRoleChange(member, event.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${member.is_active ? statusToneMap.active : statusToneMap.inactive}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-slate-500">{new Date(member.created_at).toLocaleDateString()}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => handleEditUser(member)}>
                            Edit
                          </Button>
                          <Button
                            variant={member.is_active ? 'secondary' : 'primary'}
                            size="sm"
                            loading={busyUserId === member.id}
                            onClick={() => handleToggleUserStatus(member)}
                          >
                            {member.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            loading={busyUserId === member.id}
                            onClick={() => handleDeleteUser(member)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visibleUsers.length && (
                <div className="pt-6">
                  <EmptyPanel title="No users match these filters" description="Try a different search term or clear the role filter." />
                </div>
              )}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default OrganizersView;
