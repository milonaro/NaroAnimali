import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/admin/me')
      .then(res => {
        if (res.ok) setAuth(true);
        else navigate('/admin/login');
      })
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#15803d] animate-spin" />
      </div>
    );
  }

  return auth ? <>{children}</> : null;
}
