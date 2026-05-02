import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const validate = (values) => {
  const errors = {};
  if (!values.name?.trim()) errors.name = 'Full name is required.';
  else if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';

  if (!values.email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.';

  if (!values.password) errors.password = 'Password is required.';
  else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';

  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  if (values.phone && !/^[+]?[\d\s\-()]{6,20}$/.test(values.phone)) {
    errors.phone = 'Enter a valid phone number.';
  }

  return errors;
};

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

// Password strength indicator
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'];

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${score === 4 ? 'text-emerald-600' : score >= 3 ? 'text-blue-600' : score >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
          {labels[score]} password
        </p>
      )}
    </div>
  );
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { values, errors, touched, handleChange, handleBlur, validateAll } = useForm(
    { name: '', email: '', password: '', confirmPassword: '', phone: '' },
    validate
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      const result = await register({
        name: values.name.trim(),
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone: values.phone || undefined,
      });
      toast.success(result.message || 'Account created successfully!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-slate-900">Solidarity</span>
        </div>

        <div className="card p-8">
          <div className="mb-7">
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-1.5">Create your account</h2>
            <p className="text-slate-500 text-sm">Join thousands of volunteers making a difference</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Full name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              icon={<UserIcon />}
              autoComplete="name"
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              icon={<EmailIcon />}
              autoComplete="email"
            />

            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                touched={touched.password}
                icon={<LockIcon />}
                autoComplete="new-password"
              />
              <PasswordStrength password={values.password} />
            </div>

            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              icon={<LockIcon />}
              autoComplete="new-password"
            />

            <Input
              label={<span>Phone number <span className="text-slate-400 font-normal">(optional)</span></span>}
              name="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
              touched={touched.phone}
              icon={<PhoneIcon />}
              autoComplete="tel"
            />

            <p className="text-xs text-slate-400">
              By creating an account, you agree to our{' '}
              <button type="button" className="text-emerald-600 hover:underline">Terms of Service</button>
              {' '}and{' '}
              <button type="button" className="text-emerald-600 hover:underline">Privacy Policy</button>.
            </p>

            <Button type="submit" variant="primary" loading={submitting} className="w-full py-3 text-base">
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
