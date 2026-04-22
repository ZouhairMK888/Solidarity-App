export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateRange = (start, end) => {
  if (!start && !end) return 'Dates TBD';
  if (start && !end) return `From ${formatDate(start)}`;
  if (!start && end) return `Until ${formatDate(end)}`;
  return `${formatDate(start)} → ${formatDate(end)}`;
};

export const truncate = (str, length = 120) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length).trimEnd() + '…' : str;
};

export const statusConfig = {
  active:    { label: 'Active',    className: 'badge-active' },
  draft:     { label: 'Draft',     className: 'badge-draft' },
  completed: { label: 'Completed', className: 'badge-completed' },
  cancelled: { label: 'Cancelled', className: 'badge-cancelled' },
  open:         { label: 'Open',        className: 'badge-active' },
  in_progress:  { label: 'In Progress', className: 'badge badge-draft' },
};

export const getStatusBadge = (status) =>
  statusConfig[status] || { label: status, className: 'badge-draft' };

export const missionStatusConfig = {
  open:        { label: 'Open',        className: 'badge-active' },
  in_progress: { label: 'In Progress', className: 'badge badge-draft bg-amber-100 text-amber-700' },
  completed:   { label: 'Completed',   className: 'badge-completed' },
  cancelled:   { label: 'Cancelled',   className: 'badge-cancelled' },
};

export const taskStatusConfig = {
  todo:        { label: 'To Do',       className: 'badge bg-sky-100 text-sky-700' },
  in_progress: { label: 'In Progress', className: 'badge bg-amber-100 text-amber-700' },
  completed:   { label: 'Completed',   className: 'badge bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Cancelled',   className: 'badge bg-rose-100 text-rose-700' },
};

export const getGoogleMapsUrl = (location, latitude, longitude) => {
  if (latitude && longitude) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  if (location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }

  return null;
};

export const getAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path;
};
