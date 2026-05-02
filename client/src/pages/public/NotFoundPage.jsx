import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-32 text-center animate-fade-in">
        <p className="font-display text-8xl font-bold text-emerald-100 mb-4 select-none">404</p>
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">Page not found</h1>
        <p className="text-slate-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>Go back home</Button>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
