import { getStatusBadge } from '../../utils/helpers';

const Badge = ({ status, label, className = '' }) => {
  const config = getStatusBadge(status);
  return (
    <span className={`badge ${config.className} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label || config.label}
    </span>
  );
};

export default Badge;
