import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import Card from '../../../components/ui/Card';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export const campaignStatuses = ['draft', 'active', 'completed', 'cancelled'];
export const missionStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
export const roleOptions = ['volunteer', 'organizer'];
export const defaultCenter = [33.5731, -7.5898];

export const createEmptyMissionForm = () => ({
  title: '',
  description: '',
  required_volunteers: '1',
  location: '',
  mission_date: '',
  status: 'open',
});

export const createEmptyCampaignForm = (isAdmin) => ({
  title: '',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  start_date: '',
  end_date: '',
  status: isAdmin ? 'active' : 'draft',
});

export const formatOptionLabel = (value) => value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const SparkIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 3l2.094 6.406H22l-5.547 4.03 2.118 6.498L13 15.87 7.429 19.934l2.118-6.497L4 9.406h6.906L13 3z" />
  </svg>
);

export const TeamIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a5 5 0 00-10 0v2M7 20H2v-2a3 3 0 013.356-2.857M15 7a3 3 0 11-6 0 4 4 0 018 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export const CampaignIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z" />
  </svg>
);

export const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm10 8h8v-6h-8v6zm0-10h8V3h-8v8zM3 21h8v-6H3v6z" />
  </svg>
);

export const ControlIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M7 12h10M10 17h4" />
  </svg>
);

export const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

export const MetricCard = ({ label, value, hint, icon, tint }) => (
  <Card className="relative overflow-hidden border border-white/60 bg-white/90 backdrop-blur-sm">
    <div className={`absolute inset-x-0 top-0 h-1 ${tint}`} />
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-3 font-display text-3xl text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
        {icon}
      </div>
    </div>
  </Card>
);

export const SectionTitle = ({ title, subtitle, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
    <div>
      <h2 className="font-display text-2xl text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
    {action}
  </div>
);

export const EmptyPanel = ({ title, description }) => (
  <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center shadow-card">
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-500 mt-2">{description}</p>
  </div>
);

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng);
    },
  });

  return null;
};

export const MapPicker = ({ latitude, longitude, onPick }) => {
  const hasCoordinates = latitude !== '' && longitude !== '' && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const position = hasCoordinates ? [Number(latitude), Number(longitude)] : defaultCenter;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-card">
      <MapContainer center={position} zoom={hasCoordinates ? 13 : 6} scrollWheelZoom className="h-72 w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={onPick} />
        {hasCoordinates && <Marker position={position} draggable eventHandlers={{ dragend: (event) => onPick(event.target.getLatLng()) }} />}
      </MapContainer>
    </div>
  );
};
