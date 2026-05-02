const Card = ({ children, className = '', hover = false, padding = true, ...props }) => (
  <div
    className={`card ${hover ? 'card-hover cursor-pointer' : ''} ${padding ? 'p-6' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default Card;
