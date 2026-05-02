import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDateRange, getAssetUrl, getGoogleMapsUrl, truncate } from '../../utils/helpers';

const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MissionIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const CampaignCard = ({ campaign }) => {
  const navigate = useNavigate();
  const mapsUrl = getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude);

  return (
    <div
      className="card card-hover p-0 overflow-hidden flex flex-col cursor-pointer"
      onClick={() => navigate(`/campaigns/${campaign.id}`)}
    >
      {campaign.image_url ? (
        <div className="relative h-52 overflow-hidden bg-slate-100">
          <img
            src={getAssetUrl(campaign.image_url)}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-100 via-white to-sky-100">
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.20),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_25%)]" />
          <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Community campaign
          </div>
        </div>
      )}

      {/* Color bar accent */}
      <div className={`h-1 w-full ${campaign.status === 'active' ? 'bg-emerald-500' : campaign.status === 'completed' ? 'bg-blue-400' : campaign.status === 'cancelled' ? 'bg-red-400' : 'bg-slate-300'}`} />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge status={campaign.status} />
          {campaign.mission_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium flex-shrink-0">
              <MissionIcon />
              {campaign.mission_count} mission{campaign.mission_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-slate-900 text-lg leading-snug mb-2 line-clamp-2">
          {campaign.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-3">
          {truncate(campaign.description, 140) || 'No description provided.'}
        </p>

        {/* Meta info */}
        <div className="space-y-1.5 mb-5">
          {campaign.location && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <LocationIcon />
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:text-emerald-700 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {campaign.location}
                </a>
              ) : (
                <span className="truncate">{campaign.location}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarIcon />
            <span>{formatDateRange(campaign.start_date, campaign.end_date)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
          {campaign.organizer_name && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-700">
                  {campaign.organizer_name[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-slate-500 truncate">{campaign.organizer_name}</span>
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            className="flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${campaign.id}`); }}
          >
            View details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
