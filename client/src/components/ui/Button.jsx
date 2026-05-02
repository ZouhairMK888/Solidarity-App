const sizeMap = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const variantMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none',
};

const Spinner = ({ className = '' }) => (
  <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  ...props
}) => {
  const base = variantMap[variant] || variantMap.primary;
  const sz = size === 'md' ? '' : sizeMap[size];

  return (
    <button className={`${base} ${sz} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
};

export default Button;
